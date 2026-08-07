use aes_gcm::aead::{rand_core::RngCore, Aead, OsRng};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use base64::Engine;
use sha2::{Digest, Sha256};
use std::ffi::OsStr;
use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Ipv4Addr, SocketAddrV4, TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, EventTarget, LogicalSize, Manager, PhysicalPosition, State};
use tauri_plugin_dialog::DialogExt;

#[cfg(target_os = "windows")]
use std::os::windows::{ffi::OsStrExt, process::CommandExt};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Shell::{IsUserAnAdmin, ShellExecuteW};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

const UPDATE_PROXY_BASE: &str = "https://gh.xn--8hvv1o.cn/";
const UPDATE_URL_PREFIX: &str = "https://github.com/StarCyrene/CyreneNameRoller/releases/download/";
const MIN_INSTALLER_SIZE: usize = 1024 * 1024;
const DATA_MAGIC: &[u8] = b"CYRENE1\0";
const DATA_NONCE_LENGTH: usize = 12;
const DATA_TAG_LENGTH: usize = 16;
#[cfg(target_os = "windows")]
const STARTUP_TASK_NAME: &str = "CyreneNameRollerAutoStart";
const FLOATING_WINDOW_SIZE: i32 = 64;
const MIN_FLOATING_WINDOW_SIZE: i32 = 40;
const MAX_FLOATING_WINDOW_SIZE: i32 = 256;
const FLOATING_WINDOW_SIZE_STEP: i32 = 4;

fn normalize_floating_window_size(value: Option<f64>) -> i32 {
    let Some(value) = value.filter(|value| value.is_finite()) else {
        return FLOATING_WINDOW_SIZE;
    };
    let rounded =
        (value / FLOATING_WINDOW_SIZE_STEP as f64).round() as i32 * FLOATING_WINDOW_SIZE_STEP;
    rounded.clamp(MIN_FLOATING_WINDOW_SIZE, MAX_FLOATING_WINDOW_SIZE)
}

#[cfg(target_os = "windows")]
const STARTUP_REGISTRY_VALUE: &str = "CyreneNameRoller";
const INSTANCE_PORT: u16 = 47618;
const INSTANCE_MESSAGE: &[u8] = b"CYRENE_SHOW_MAIN_V1\n";
const INSTANCE_ACK: &[u8] = b"CYRENE_SHOW_ACK_V1\n";
const INSTANCE_REPLACE_MESSAGE: &[u8] = b"CYRENE_REPLACE_INSTANCE_V1\n";
const INSTANCE_REPLACE_ACK: &[u8] = b"CYRENE_REPLACE_ACK_V1\n";
const INSTANCE_URI_PREFIX: &str = "CYRENE_OPEN_URI_V1 ";
const INSTANCE_URI_ACK: &[u8] = b"CYRENE_OPEN_URI_ACK_V1\n";
const URI_SCHEME: &str = "cyrenenr";
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn background_command<S: AsRef<OsStr>>(program: S) -> Command {
    let mut command = Command::new(program);
    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);
    command
}

#[cfg(target_os = "windows")]
fn wide(value: &OsStr) -> Vec<u16> {
    value.encode_wide().chain(std::iter::once(0)).collect()
}

#[cfg(target_os = "windows")]
fn shell_execute(operation: &str, file: &OsStr, parameters: Option<&str>) -> Result<(), String> {
    let operation = wide(OsStr::new(operation));
    let file = wide(file);
    let parameters = parameters.map(|value| wide(OsStr::new(value)));
    let result = unsafe {
        ShellExecuteW(
            std::ptr::null_mut(),
            operation.as_ptr(),
            file.as_ptr(),
            parameters
                .as_ref()
                .map_or(std::ptr::null(), |value| value.as_ptr()),
            std::ptr::null(),
            SW_SHOWNORMAL,
        )
    } as isize;
    if result > 32 {
        Ok(())
    } else {
        Err(format!("Windows 启动操作失败 ({})", result))
    }
}

fn instance_address() -> SocketAddrV4 {
    SocketAddrV4::new(Ipv4Addr::LOCALHOST, INSTANCE_PORT)
}

fn notify_instance(message: &[u8], expected_ack: &[u8]) -> bool {
    let Ok(mut stream) =
        TcpStream::connect_timeout(&instance_address().into(), Duration::from_millis(800))
    else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(800)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(800)));
    if stream.write_all(message).is_err() {
        return false;
    }
    let mut acknowledgement = vec![0u8; expected_ack.len()];
    stream.read_exact(&mut acknowledgement).is_ok() && acknowledgement == expected_ack
}

fn notify_existing_instance() -> bool {
    notify_instance(INSTANCE_MESSAGE, INSTANCE_ACK)
}

fn is_cyrene_uri(value: &str) -> bool {
    value.get(..URI_SCHEME.len()).is_some_and(|scheme| {
        scheme.eq_ignore_ascii_case(URI_SCHEME)
            && value
                .get(URI_SCHEME.len()..URI_SCHEME.len() + 3)
                .is_some_and(|separator| separator == "://")
    })
}

fn launch_uri_from_arguments(arguments: &[String]) -> Option<String> {
    arguments
        .iter()
        .find(|argument| is_cyrene_uri(argument))
        .cloned()
}

fn notify_existing_instance_with_uri(uri: &str) -> bool {
    if !is_cyrene_uri(uri) || uri.contains(['\r', '\n']) {
        return false;
    }
    let message = format!("{}{}\n", INSTANCE_URI_PREFIX, uri);
    notify_instance(message.as_bytes(), INSTANCE_URI_ACK)
}

fn request_existing_instance_exit() -> bool {
    notify_instance(INSTANCE_REPLACE_MESSAGE, INSTANCE_REPLACE_ACK)
}

fn acquire_instance_listener(
    wait_for_replaced_instance: bool,
    launch_uri: Option<&str>,
) -> TcpListener {
    let deadline = Instant::now()
        + if wait_for_replaced_instance {
            Duration::from_secs(12)
        } else {
            Duration::from_millis(1200)
        };
    loop {
        match TcpListener::bind(instance_address()) {
            Ok(listener) => return listener,
            Err(error) => {
                let notified = launch_uri
                    .map(notify_existing_instance_with_uri)
                    .unwrap_or_else(notify_existing_instance);
                if !wait_for_replaced_instance && notified {
                    std::process::exit(0);
                }
                if Instant::now() >= deadline {
                    let notified = launch_uri
                        .map(notify_existing_instance_with_uri)
                        .unwrap_or_else(notify_existing_instance);
                    if notified {
                        std::process::exit(0);
                    }
                    eprintln!("[single-instance] 无法绑定本机 IPC：{}", error);
                    std::process::exit(3);
                }
                std::thread::sleep(Duration::from_millis(120));
            }
        }
    }
}

fn start_instance_listener(listener: TcpListener, app: tauri::AppHandle) {
    std::thread::spawn(move || {
        for incoming in listener.incoming() {
            let Ok(mut stream) = incoming else { continue };
            let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
            let mut message = String::new();
            let read_result = {
                let mut reader = BufReader::new(&mut stream);
                reader.read_line(&mut message)
            };
            if read_result.is_err() {
                continue;
            }
            if message.as_bytes() == INSTANCE_MESSAGE {
                let _ = stream.write_all(INSTANCE_ACK);
                let _ = request_reveal_main_window(&app);
            } else if message.as_bytes() == INSTANCE_REPLACE_MESSAGE {
                let _ = stream.write_all(INSTANCE_REPLACE_ACK);
                let exit_handle = app.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_millis(100));
                    exit_handle.exit(0);
                });
            } else if let Some(uri) = message
                .trim_end_matches(['\r', '\n'])
                .strip_prefix(INSTANCE_URI_PREFIX)
                .filter(|uri| is_cyrene_uri(uri))
            {
                let _ = stream.write_all(INSTANCE_URI_ACK);
                let _ = request_open_uri(&app, uri.to_string());
            }
        }
    });
}

struct MainWindowRevealState {
    frontend_ready: AtomicBool,
    pending: AtomicBool,
}

impl MainWindowRevealState {
    fn new() -> Self {
        Self {
            frontend_ready: AtomicBool::new(false),
            pending: AtomicBool::new(false),
        }
    }
}

struct EncryptedStore {
    path: PathBuf,
    values: Mutex<serde_json::Value>,
    integrity_error: Mutex<Option<String>>,
}

impl EncryptedStore {
    fn load(path: PathBuf) -> Self {
        let directory_error = path
            .parent()
            .and_then(|parent| fs::create_dir_all(parent).err())
            .map(|error| error.to_string());
        let (values, integrity_error) = if let Some(error) = directory_error {
            (serde_json::json!({}), Some(error))
        } else {
            match fs::read(&path) {
                Ok(bytes) => match decrypt_data(&bytes) {
                    Ok(values) => (values, None),
                    Err(error) => (serde_json::json!({}), Some(error)),
                },
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                    (serde_json::json!({}), None)
                }
                Err(error) => (serde_json::json!({}), Some(error.to_string())),
            }
        };
        Self {
            path,
            values: Mutex::new(values),
            integrity_error: Mutex::new(integrity_error),
        }
    }

    fn is_healthy(&self) -> Result<(), String> {
        self.integrity_error
            .lock()
            .map_err(|_| "数据锁定失败".to_string())?
            .clone()
            .map_or(Ok(()), Err)
    }

    fn persist(&self) -> Result<(), String> {
        self.is_healthy()?;
        let values = self
            .values
            .lock()
            .map_err(|_| "数据锁定失败".to_string())?
            .clone();
        let temporary_path = self.path.with_extension("cyrene.tmp");
        fs::write(&temporary_path, encrypt_data(&values)?).map_err(|error| error.to_string())?;
        let backup_path = self.path.with_extension("cyrene.bak");
        let _ = fs::remove_file(&backup_path);
        if self.path.exists() {
            fs::rename(&self.path, &backup_path).map_err(|error| error.to_string())?;
        }
        match fs::rename(&temporary_path, &self.path) {
            Ok(_) => {
                let _ = fs::remove_file(backup_path);
                Ok(())
            }
            Err(error) => {
                if backup_path.exists() {
                    let _ = fs::rename(&backup_path, &self.path);
                }
                Err(error.to_string())
            }
        }
    }
}

fn legacy_installation_data_dir() -> PathBuf {
    let root = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let dir = root.join("data");
    fs::create_dir_all(&dir).ok();
    dir
}

fn get_resource_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .resource_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn data_key() -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(b"CyreneNameRoller:encrypted-data:v1:cn.cyrene2008.nameroller");
    hasher.finalize().into()
}

fn encrypt_data(values: &serde_json::Value) -> Result<Vec<u8>, String> {
    let key = data_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
    let mut nonce = [0u8; DATA_NONCE_LENGTH];
    OsRng.fill_bytes(&mut nonce);
    let plain = serde_json::to_vec(values).map_err(|error| error.to_string())?;
    let encrypted = cipher
        .encrypt(Nonce::from_slice(&nonce), plain.as_ref())
        .map_err(|error| error.to_string())?;
    let mut output = Vec::with_capacity(DATA_MAGIC.len() + nonce.len() + encrypted.len());
    output.extend_from_slice(DATA_MAGIC);
    output.extend_from_slice(&nonce);
    output.extend_from_slice(&encrypted);
    Ok(output)
}

fn decrypt_data(bytes: &[u8]) -> Result<serde_json::Value, String> {
    if bytes.len() <= DATA_MAGIC.len() + DATA_NONCE_LENGTH + DATA_TAG_LENGTH {
        return Err("数据文件格式无效".into());
    }
    if !bytes.starts_with(DATA_MAGIC) {
        return Err("数据文件标识无效".into());
    }
    let nonce_start = DATA_MAGIC.len();
    let nonce_end = nonce_start + DATA_NONCE_LENGTH;
    let key = data_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|error| error.to_string())?;
    let plain = cipher
        .decrypt(
            Nonce::from_slice(&bytes[nonce_start..nonce_end]),
            &bytes[nonce_end..],
        )
        .map_err(|_| "数据完整性校验失败，文件可能已被篡改".to_string())?;
    let values: serde_json::Value =
        serde_json::from_slice(&plain).map_err(|_| "数据内容无效".to_string())?;
    if !values.is_object() {
        return Err("数据内容无效".into());
    }
    Ok(values)
}

// 保存主窗口的尺寸、位置与最大化状态，供下次启动恢复
fn save_window_state(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(size) = window.outer_size() {
            let store = app.state::<EncryptedStore>();
            if store.is_healthy().is_ok() {
                if let Ok(mut values) = store.values.lock() {
                    values["windowState"] = serde_json::json!({
                        "width": size.width,
                        "height": size.height,
                        "isMaximized": window.is_maximized().unwrap_or(false),
                    });
                }
                let _ = store.persist();
            }
        }
    }
}

// 恢复尺寸后重新居中，并限制在当前显示器内，避免高 DPI 下窗口被挤到屏幕边缘。
fn restore_window_state(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let store = app.state::<EncryptedStore>();
        let state = store
            .values
            .lock()
            .ok()
            .and_then(|values| values.get("windowState").cloned());
        if state
            .as_ref()
            .and_then(|value| value["isMaximized"].as_bool())
            == Some(true)
        {
            let _ = window.maximize();
            return;
        }

        let saved_size = state.as_ref().and_then(|value| {
            Some((
                value["width"].as_u64()? as u32,
                value["height"].as_u64()? as u32,
            ))
        });
        let current_size = window
            .outer_size()
            .ok()
            .map(|size| (size.width, size.height));
        if let Some((mut width, mut height)) = saved_size.or(current_size) {
            if let Ok(Some(monitor)) = window.current_monitor() {
                let monitor_size = monitor.size();
                width = width.min((monitor_size.width as f64 * 0.9) as u32);
                height = height.min((monitor_size.height as f64 * 0.86) as u32);
            }
            let _ = window.set_size(tauri::PhysicalSize::new(width, height));
        }
        let _ = window.center();
    }
}

fn center_floating_window(
    work_x: i32,
    work_y: i32,
    work_width: u32,
    work_height: u32,
    scale_factor: f64,
    logical_size: i32,
) -> (i32, i32) {
    let physical_size = logical_size as f64 * scale_factor;
    let x = work_x as f64 + (work_width as f64 - physical_size) / 2.0;
    let y = work_y as f64 + (work_height as f64 - physical_size) / 2.0;
    (x.round() as i32, y.round() as i32)
}

fn floating_window_position_visible(
    x: i32,
    y: i32,
    work_areas: &[(i32, i32, u32, u32, f64)],
    logical_size: i32,
) -> bool {
    let left = x as i64;
    let top = y as i64;

    work_areas
        .iter()
        .any(|(work_x, work_y, work_width, work_height, scale_factor)| {
            let physical_size = (logical_size as f64 * scale_factor).round() as i64;
            let right = left + physical_size;
            let bottom = top + physical_size;
            let work_left = *work_x as i64;
            let work_top = *work_y as i64;
            let work_right = work_left + *work_width as i64;
            let work_bottom = work_top + *work_height as i64;
            left < work_right && right > work_left && top < work_bottom && bottom > work_top
        })
}

fn resize_floating_window_position(x: i32, y: i32, old_size: i32, new_size: i32) -> (i32, i32) {
    let delta = (old_size - new_size) as f64 / 2.0;
    (
        (x as f64 + delta).round() as i32,
        (y as f64 + delta).round() as i32,
    )
}

fn constrain_floating_window_position(
    x: i32,
    y: i32,
    physical_size: i32,
    work_x: i32,
    work_y: i32,
    work_width: u32,
    work_height: u32,
) -> (i32, i32) {
    let max_x = work_x
        .saturating_add(work_width as i32)
        .saturating_sub(physical_size);
    let max_y = work_y
        .saturating_add(work_height as i32)
        .saturating_sub(physical_size);
    (
        x.clamp(work_x, max_x.max(work_x)),
        y.clamp(work_y, max_y.max(work_y)),
    )
}

fn floating_work_areas(app: &tauri::AppHandle) -> Result<Vec<(i32, i32, u32, u32, f64)>, String> {
    app.available_monitors()
        .map_err(|error| error.to_string())
        .map(|monitors| {
            monitors
                .into_iter()
                .map(|monitor| {
                    let area = monitor.work_area();
                    (
                        area.position.x,
                        area.position.y,
                        area.size.width,
                        area.size.height,
                        monitor.scale_factor(),
                    )
                })
                .collect()
        })
}

fn floating_window_size(app: &tauri::AppHandle) -> i32 {
    let store = app.state::<EncryptedStore>();
    let value = store.values.lock().ok().and_then(|values| {
        values["settings"]["floatingWindowSize"]
            .as_f64()
            .or_else(|| {
                values["settings"]["floatingWindowSize"]
                    .as_i64()
                    .map(|value| value as f64)
            })
    });
    normalize_floating_window_size(value)
}

fn primary_floating_position(
    app: &tauri::AppHandle,
    logical_size: i32,
) -> Result<(i32, i32), String> {
    let monitor = app
        .primary_monitor()
        .map_err(|error| error.to_string())?
        .ok_or_else(|| "无法获取主屏幕信息".to_string())?;
    let area = monitor.work_area();
    Ok(center_floating_window(
        area.position.x,
        area.position.y,
        area.size.width,
        area.size.height,
        monitor.scale_factor(),
        logical_size,
    ))
}

fn stored_tauri_floating_position(app: &tauri::AppHandle) -> Option<(i32, i32)> {
    let store = app.state::<EncryptedStore>();
    let values = store.values.lock().ok()?;
    let position = &values["floatingWindowPosition"]["tauri"];
    let x = i32::try_from(position["x"].as_i64()?).ok()?;
    let y = i32::try_from(position["y"].as_i64()?).ok()?;
    Some((x, y))
}

fn resolve_tauri_floating_position(
    app: &tauri::AppHandle,
    logical_size: i32,
) -> Result<((i32, i32), bool), String> {
    let work_areas = floating_work_areas(app)?;
    if let Some((x, y)) = stored_tauri_floating_position(app) {
        if floating_window_position_visible(x, y, &work_areas, logical_size) {
            return Ok(((x, y), false));
        }
    }
    Ok((primary_floating_position(app, logical_size)?, true))
}

fn floating_work_area_for_center(
    work_areas: &[(i32, i32, u32, u32, f64)],
    center_x: i32,
    center_y: i32,
) -> Option<(i32, i32, u32, u32, f64)> {
    work_areas.iter().copied().find(|(x, y, width, height, _)| {
        center_x >= *x
            && center_x < x.saturating_add(*width as i32)
            && center_y >= *y
            && center_y < y.saturating_add(*height as i32)
    })
}

fn persist_tauri_floating_position(app: &tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    let store = app.state::<EncryptedStore>();
    store.is_healthy()?;
    let previous_position_value;
    {
        let mut values = store
            .values
            .lock()
            .map_err(|_| "数据锁定失败".to_string())?;
        let root = values
            .as_object_mut()
            .ok_or_else(|| "数据内容无效".to_string())?;
        previous_position_value = root.get("floatingWindowPosition").cloned();
        let positions = root
            .entry("floatingWindowPosition".to_string())
            .or_insert_with(|| serde_json::json!({}));
        if !positions.is_object() {
            *positions = serde_json::json!({});
        }
        positions
            .as_object_mut()
            .expect("floatingWindowPosition was normalized to an object")
            .insert("tauri".to_string(), serde_json::json!({ "x": x, "y": y }));
    }

    if let Err(error) = store.persist() {
        if let Ok(mut values) = store.values.lock() {
            if let Some(root) = values.as_object_mut() {
                if let Some(previous) = previous_position_value {
                    root.insert("floatingWindowPosition".to_string(), previous);
                } else {
                    root.remove("floatingWindowPosition");
                }
            }
        }
        return Err(error);
    }
    Ok(())
}

async fn download_installer_bytes(
    app: &tauri::AppHandle,
    url: &str,
    expected_size: u64,
    source: &str,
) -> Result<Vec<u8>, String> {
    if !url.starts_with(UPDATE_URL_PREFIX) {
        return Err("更新地址不属于 CyreneNameRoller 官方发布源".into());
    }
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(15))
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    let urls = if source == "github" {
        vec![url.to_string()]
    } else if source == "ghproxy" {
        vec![format!("https://gh-proxy.com/{}", url)]
    } else {
        vec![format!("{}{}", UPDATE_PROXY_BASE, url)]
    };
    let mut failures = Vec::new();

    for candidate_url in urls {
        match client
            .get(&candidate_url)
            .header("User-Agent", "CyreneNameRoller")
            .header("Accept", "application/octet-stream")
            .send()
            .await
        {
            Ok(mut resp) if resp.status().is_success() => {
                let content_type = resp
                    .headers()
                    .get(reqwest::header::CONTENT_TYPE)
                    .and_then(|value| value.to_str().ok())
                    .unwrap_or("")
                    .to_ascii_lowercase();
                if content_type.contains("text/html") || content_type.contains("application/json") {
                    failures.push(format!("服务器返回了非安装程序内容 ({})", content_type));
                    continue;
                }

                let total_size = if expected_size > 0 {
                    expected_size
                } else {
                    resp.content_length().unwrap_or(0)
                };
                let mut bytes = Vec::with_capacity(total_size.min(usize::MAX as u64) as usize);
                let mut last_progress = 0u8;
                let mut download_error = None;
                let _ = app.emit("update-download-progress", 0u8);

                loop {
                    match resp.chunk().await {
                        Ok(Some(chunk)) => {
                            bytes.extend_from_slice(&chunk);
                            if total_size > 0 {
                                let progress =
                                    ((bytes.len() as u64 * 99) / total_size).min(99) as u8;
                                if progress > last_progress {
                                    last_progress = progress;
                                    let _ = app.emit("update-download-progress", progress);
                                }
                            }
                        }
                        Ok(None) => break,
                        Err(error) => {
                            download_error = Some(error.to_string());
                            break;
                        }
                    }
                }

                if let Some(error) = download_error {
                    failures.push(error);
                    continue;
                }

                let actual_size = bytes.len() as u64;
                if expected_size > 0 && actual_size != expected_size {
                    failures.push(format!(
                        "安装程序不完整：应为 {} 字节，实际为 {} 字节",
                        expected_size, actual_size
                    ));
                    continue;
                }
                if bytes.len() < MIN_INSTALLER_SIZE {
                    failures.push(format!("安装程序体积异常：仅 {} 字节", bytes.len()));
                    continue;
                }
                if !bytes.starts_with(b"MZ") {
                    failures.push("安装程序文件头无效，不是 Windows PE 文件".into());
                    continue;
                }
                return Ok(bytes);
            }
            Ok(resp) => failures.push(format!("更新服务器返回 HTTP {}", resp.status())),
            Err(error) => failures.push(error.to_string()),
        }
    }
    Err(if failures.is_empty() {
        "下载失败，请检查网络或稍后重试".into()
    } else {
        failures.join("；")
    })
}

fn installer_temp_path(file_name: &str) -> Result<PathBuf, String> {
    let safe_name = Path::new(file_name)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| name.to_ascii_lowercase().ends_with(".exe"))
        .ok_or_else(|| "安装程序文件名无效".to_string())?;
    let update_dir = std::env::temp_dir().join("CyreneNameRoller-Update");
    fs::create_dir_all(&update_dir).map_err(|error| error.to_string())?;
    Ok(update_dir.join(safe_name))
}

fn launch_installer(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new(path)
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|error| error.to_string())
    }
}

#[tauri::command]
fn storage_get(store: State<'_, EncryptedStore>, key: String) -> Option<serde_json::Value> {
    if store.is_healthy().is_err() {
        return None;
    }
    store
        .values
        .lock()
        .ok()
        .and_then(|values| values.get(&key).cloned())
}

fn migrate_legacy_data(app: &tauri::AppHandle) {
    let store = app.state::<EncryptedStore>();
    if store.path.exists() || store.is_healthy().is_err() {
        return;
    }

    // 26.0.5 曾把数据写在安装目录。普通用户通常无权写 Program Files，
    // 因此只读取并迁移到当前用户的 AppData，保留原文件作为回退备份。
    let installed_data = legacy_installation_data_dir().join("cyrene-data.cyrene");
    if installed_data != store.path {
        if let Ok(bytes) = fs::read(&installed_data) {
            if let Ok(values) = decrypt_data(&bytes) {
                if let Ok(mut current_values) = store.values.lock() {
                    *current_values = values;
                }
                if store.persist().is_ok() {
                    return;
                }
            }
        }
    }

    let legacy_dir = match app.path().app_data_dir() {
        Ok(path) => path.join("data"),
        Err(_) => return,
    };
    let mut values = serde_json::Map::new();
    let mut legacy_paths = Vec::new();
    if let Ok(entries) = fs::read_dir(&legacy_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|extension| extension.to_str()) != Some("json") {
                continue;
            }
            let Ok(raw) = fs::read_to_string(&path) else {
                continue;
            };
            let Ok(value) = serde_json::from_str::<serde_json::Value>(&raw) else {
                continue;
            };
            let Some(stem) = path.file_stem().and_then(|stem| stem.to_str()) else {
                continue;
            };
            if stem == "window-state" {
                values.insert(
                    "windowState".into(),
                    serde_json::json!({
                        "width": value["width"],
                        "height": value["height"],
                        "isMaximized": value["maximized"].as_bool().unwrap_or(false),
                    }),
                );
            } else {
                values.insert(stem.to_string(), value);
            }
            legacy_paths.push(path);
        }
    }
    if values.is_empty() {
        return;
    }
    if let Ok(mut current_values) = store.values.lock() {
        *current_values = serde_json::Value::Object(values);
    } else {
        return;
    }
    if store.persist().is_ok() {
        legacy_paths.into_iter().for_each(|path| {
            let _ = fs::remove_file(path);
        });
    }
}

#[tauri::command]
fn storage_set(
    store: State<'_, EncryptedStore>,
    key: String,
    value: serde_json::Value,
) -> serde_json::Value {
    if store.is_healthy().is_err() {
        return serde_json::json!({ "success": false, "error": "数据文件完整性检查失败" });
    }
    if let Ok(mut values) = store.values.lock() {
        if let Some(object) = values.as_object_mut() {
            object.insert(key, value);
        } else {
            return serde_json::json!({ "success": false, "error": "数据内容无效" });
        }
    } else {
        return serde_json::json!({ "success": false, "error": "数据锁定失败" });
    }
    match store.persist() {
        Ok(_) => serde_json::json!({ "success": true, "filePath": store.path.to_string_lossy() }),
        Err(error) => serde_json::json!({ "success": false, "error": error }),
    }
}

#[tauri::command]
fn storage_delete(store: State<'_, EncryptedStore>, key: String) -> bool {
    if store.is_healthy().is_err() {
        return false;
    }
    if let Ok(mut values) = store.values.lock() {
        if let Some(object) = values.as_object_mut() {
            object.remove(&key);
        } else {
            return false;
        }
    } else {
        return false;
    }
    store.persist().is_ok()
}

#[tauri::command]
fn storage_clear(store: State<'_, EncryptedStore>) -> bool {
    if store.is_healthy().is_err() {
        return false;
    }
    if let Ok(mut values) = store.values.lock() {
        *values = serde_json::json!({});
    } else {
        return false;
    }
    store.persist().is_ok()
}

#[tauri::command]
fn export_encrypted_data(store: State<'_, EncryptedStore>) -> Result<String, String> {
    store.persist()?;
    let bytes = fs::read(&store.path).map_err(|error| error.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
fn import_encrypted_data(
    store: State<'_, EncryptedStore>,
    encoded_data: String,
) -> Result<bool, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(encoded_data)
        .map_err(|_| "导入文件编码无效".to_string())?;
    let values = decrypt_data(&bytes)?;
    if let Ok(mut current_values) = store.values.lock() {
        *current_values = values;
    } else {
        return Err("数据锁定失败".into());
    }
    store.persist()?;
    Ok(true)
}

#[tauri::command]
async fn save_text_file(
    app: tauri::AppHandle,
    content: String,
    default_name: String,
    extension: String,
) -> Result<serde_json::Value, String> {
    let safe_extension: String = extension
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .collect();
    let safe_extension = if safe_extension.is_empty() {
        "json".to_string()
    } else {
        safe_extension
    };
    let selected = app
        .dialog()
        .file()
        .set_title("保存文件")
        .set_file_name(default_name)
        .add_filter(
            format!("{} 文件", safe_extension.to_uppercase()),
            &[safe_extension.as_str()],
        )
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    fs::write(&path, content).map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true, "filePath": path.to_string_lossy() }))
}

#[tauri::command]
async fn open_text_file(
    app: tauri::AppHandle,
    extension: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let raw_extensions: Vec<String> = match extension {
        serde_json::Value::Array(values) => values
            .into_iter()
            .filter_map(|value| value.as_str().map(ToOwned::to_owned))
            .collect(),
        serde_json::Value::String(value) => vec![value],
        _ => Vec::new(),
    };
    let mut safe_extensions: Vec<String> = raw_extensions
        .into_iter()
        .map(|value| {
            value
                .chars()
                .filter(|character| character.is_ascii_alphanumeric())
                .collect::<String>()
                .to_lowercase()
        })
        .filter(|value| !value.is_empty())
        .collect();
    safe_extensions.sort();
    safe_extensions.dedup();
    if safe_extensions.is_empty() {
        safe_extensions.push("json".to_string());
    }
    let filter_name = format!(
        "{} 文件",
        safe_extensions
            .iter()
            .map(|value| value.to_uppercase())
            .collect::<Vec<_>>()
            .join(" / ")
    );
    let filter_extensions: Vec<&str> = safe_extensions.iter().map(String::as_str).collect();
    let selected = app
        .dialog()
        .file()
        .set_title("打开文件")
        .add_filter(filter_name, &filter_extensions)
        .blocking_pick_file();
    let Some(selected) = selected else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    Ok(
        serde_json::json!({ "success": true, "content": content, "filePath": path.to_string_lossy() }),
    )
}

struct UriRequestState {
    frontend_ready: AtomicBool,
    pending: Mutex<Vec<String>>,
}

impl UriRequestState {
    fn new() -> Self {
        Self {
            frontend_ready: AtomicBool::new(false),
            pending: Mutex::new(Vec::new()),
        }
    }
}

fn request_open_uri(app: &tauri::AppHandle, uri: String) -> Result<(), String> {
    if !is_cyrene_uri(&uri) {
        return Err("不支持的 URI 协议".into());
    }
    let state = app.state::<UriRequestState>();
    if state.frontend_ready.load(Ordering::Acquire) {
        app.emit("uri-open-requested", uri)
            .map_err(|error| error.to_string())?;
    } else {
        state
            .pending
            .lock()
            .map_err(|_| "URI 请求队列锁定失败".to_string())?
            .push(uri);
    }
    Ok(())
}

#[tauri::command]
async fn plugin_select_file(
    app: tauri::AppHandle,
    extensions: Vec<String>,
) -> Result<serde_json::Value, String> {
    let mut safe_extensions: Vec<String> = extensions
        .into_iter()
        .map(|value| {
            value
                .chars()
                .filter(|character| character.is_ascii_alphanumeric())
                .collect::<String>()
                .to_lowercase()
        })
        .filter(|value| !value.is_empty() && value.len() <= 12)
        .take(24)
        .collect();
    safe_extensions.sort();
    safe_extensions.dedup();
    let mut picker = app.dialog().file().set_title("插件选择文件");
    if !safe_extensions.is_empty() {
        let filter_extensions: Vec<&str> = safe_extensions.iter().map(String::as_str).collect();
        picker = picker.add_filter("允许的文件", &filter_extensions);
    }
    let Some(selected) = picker.blocking_pick_file() else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("插件只能选择普通文件".into());
    }
    if metadata.len() > 32 * 1024 * 1024 {
        return Err("插件选择的文件不能超过 32 MB".into());
    }
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(serde_json::json!({
        "success": true,
        "name": path.file_name().and_then(OsStr::to_str).unwrap_or("file"),
        "path": path.to_string_lossy(),
        "size": metadata.len(),
        "base64": base64::engine::general_purpose::STANDARD.encode(bytes)
    }))
}

#[tauri::command]
async fn plugin_select_directory(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let Some(selected) = app
        .dialog()
        .file()
        .set_title("插件选择目录")
        .blocking_pick_folder()
    else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    Ok(serde_json::json!({
        "success": true,
        "name": path.file_name().and_then(OsStr::to_str).unwrap_or("directory"),
        "path": path.to_string_lossy()
    }))
}

#[tauri::command]
async fn plugin_execute_operation(
    program: String,
    args: Vec<String>,
    timeout_ms: u64,
) -> Result<serde_json::Value, String> {
    if program.is_empty()
        || program.len() > 128
        || !program
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || "_.-".contains(character))
    {
        return Err("插件系统操作的程序名无效".into());
    }
    if args.len() > 32
        || args
            .iter()
            .any(|argument| argument.contains('\0') || argument.len() > 2048)
    {
        return Err("插件系统操作的固定参数无效".into());
    }
    let timeout_ms = timeout_ms.clamp(1000, 30000);
    tauri::async_runtime::spawn_blocking(move || {
        let mut command = background_command(&program);
        command
            .args(&args)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let mut child = command.spawn().map_err(|error| error.to_string())?;
        let deadline = Instant::now() + Duration::from_millis(timeout_ms);
        loop {
            if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
                return Ok(serde_json::json!({
                    "success": status.success(),
                    "exitCode": status.code(),
                    "timedOut": false,
                    "error": if status.success() { "" } else { "系统操作返回非零退出状态" }
                }));
            }
            if Instant::now() >= deadline {
                let _ = child.kill();
                let _ = child.wait();
                return Ok(serde_json::json!({
                    "success": false,
                    "timedOut": true,
                    "error": "系统操作执行超时"
                }));
            }
            std::thread::sleep(Duration::from_millis(25));
        }
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
async fn export_data_file(
    app: tauri::AppHandle,
    store: State<'_, EncryptedStore>,
) -> Result<serde_json::Value, String> {
    store.persist()?;
    let selected = app
        .dialog()
        .file()
        .set_title("导出程序数据")
        .set_file_name("cyrene-data.cyrene")
        .add_filter("Cyrene Data", &["cyrene"])
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    fs::copy(&store.path, &path).map_err(|error| error.to_string())?;
    Ok(serde_json::json!({ "success": true, "filePath": path.to_string_lossy() }))
}

#[tauri::command]
async fn import_data_file(
    app: tauri::AppHandle,
    store: State<'_, EncryptedStore>,
) -> Result<serde_json::Value, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("导入程序数据")
        .add_filter("Cyrene Data", &["cyrene"])
        .blocking_pick_file();
    let Some(selected) = selected else {
        return Ok(serde_json::json!({ "success": false, "cancelled": true }));
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let values = decrypt_data(&bytes)?;
    *store
        .values
        .lock()
        .map_err(|_| "数据锁定失败".to_string())? = values;
    store.persist()?;
    Ok(serde_json::json!({ "success": true, "filePath": path.to_string_lossy() }))
}

#[tauri::command]
fn load_names(app: tauri::AppHandle) -> serde_json::Value {
    let resource_dir = get_resource_dir(&app);
    let paths = [
        resource_dir.join("names.json"),
        PathBuf::from("public/names.json"),
        PathBuf::from("dist/names.json"),
    ];
    for p in &paths {
        if let Ok(s) = fs::read_to_string(p) {
            if let Ok(v) = serde_json::from_str(&s) {
                return v;
            }
        }
    }
    serde_json::json!({ "names": [] })
}

#[tauri::command]
fn load_changelog() -> serde_json::Value {
    let raw = include_str!("../../public/updatelogs/up.json");
    serde_json::from_str(raw).unwrap_or(serde_json::json!([]))
}

#[tauri::command]
async fn check_update() -> Result<serde_json::Value, String> {
    let urls = [
        "https://api.github.com/repos/StarCyrene/CyreneNameRoller/releases/latest",
        "https://api.kkgithub.com/repos/StarCyrene/CyreneNameRoller/releases/latest",
    ];
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;
    for url in &urls {
        if let Ok(resp) = client
            .get(*url)
            .header("User-Agent", "CyreneNameRoller")
            .header("Accept", "application/vnd.github.v3+json")
            .send()
            .await
        {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                return Ok(json);
            }
        }
    }
    Err("无法连接到更新服务器".into())
}

#[tauri::command]
fn open_external(url: String) {
    #[cfg(target_os = "windows")]
    {
        let _ = shell_execute("open", OsStr::new(&url), None);
    }
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&url).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("xdg-open").arg(&url).spawn();
    }
}

// 公告缓存文件路径：写入系统 TEMP（无权限问题，且可离线复用）
fn announcement_cache_path() -> PathBuf {
    let dir = std::env::temp_dir().join("CyreneNameRoller");
    let _ = fs::create_dir_all(&dir);
    dir.join("announcement.json")
}

// 由原生层（Rust reqwest，服务端到服务端，不带浏览器 Origin 头）拉取公告，
// 规避 webview 的跨域拦截。下载到 TEMP 再读回；全部失败则复用本地缓存（离线兜底）。
#[tauri::command]
async fn fetch_announcements() -> Result<serde_json::Value, String> {
    let urls = [
        // 镜像代理（refs/heads/master）—— 你确认可用的主源
        "https://gh.xn--8hvv1o.cn/raw.githubusercontent.com/StarCyrene/CyreneNameRoller/refs/heads/master/.announcement/latest.json",
        // 自建 nameapi 镜像
        "https://nameapi.cyrene.hi.cn/announcement/latest.json",
        // 直连 raw.githubusercontent 兜底
        "https://raw.githubusercontent.com/StarCyrene/CyreneNameRoller/master/.announcement/latest.json",
    ];
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let cache = announcement_cache_path();

    for url in &urls {
        if let Ok(resp) = client
            .get(*url)
            .header("User-Agent", "CyreneNameRoller")
            .send()
            .await
        {
            if resp.status().is_success() {
                if let Ok(bytes) = resp.bytes().await {
                    // 1) 下载到 TEMP 缓存文件
                    let _ = fs::write(&cache, &bytes);
                    // 2) 从磁盘读回并解析
                    if let Ok(s) = fs::read_to_string(&cache) {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                            return Ok(v);
                        }
                    }
                }
            }
        }
    }

    // 全部拉取失败：尝试读取之前已缓存的文件（离线兜底）
    if let Ok(s) = fs::read_to_string(&cache) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
            return Ok(v);
        }
    }
    Err("无法获取公告内容".into())
}

#[tauri::command]
async fn download_and_launch_update(
    app: tauri::AppHandle,
    url: String,
    file_name: String,
    expected_size: u64,
    source: String,
) -> Result<serde_json::Value, String> {
    let bytes = download_installer_bytes(&app, &url, expected_size, &source).await?;
    let path = installer_temp_path(&file_name)?;
    let partial_path = path.with_extension("exe.part");
    let _ = fs::remove_file(&partial_path);
    fs::write(&partial_path, &bytes).map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&path);
    fs::rename(&partial_path, &path).map_err(|error| error.to_string())?;
    launch_installer(&path).map_err(|error| format!("无法启动安装程序：{}", error))?;

    let exit_handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(1500));
        exit_handle.exit(0);
    });

    Ok(serde_json::json!({
        "success": true,
        "filePath": path.to_string_lossy(),
        "size": bytes.len()
    }))
}

#[tauri::command]
async fn open_floating_window(app: tauri::AppHandle) -> Result<(), String> {
    let size = floating_window_size(&app);
    if let Some(win) = app.get_webview_window("floating") {
        win.set_size(LogicalSize::new(size as f64, size as f64))
            .map_err(|e| e.to_string())?;
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    let ((x, y), used_fallback) = resolve_tauri_floating_position(&app, size)?;
    let win = tauri::WebviewWindowBuilder::new(
        &app,
        "floating",
        tauri::WebviewUrl::App("index.html#/floating".into()),
    )
    .always_on_top(true)
    .skip_taskbar(true)
    .decorations(false)
    .shadow(false)
    .resizable(false)
    .transparent(true)
    .inner_size(size as f64, size as f64)
    .min_inner_size(
        MIN_FLOATING_WINDOW_SIZE as f64,
        MIN_FLOATING_WINDOW_SIZE as f64,
    )
    .max_inner_size(
        MAX_FLOATING_WINDOW_SIZE as f64,
        MAX_FLOATING_WINDOW_SIZE as f64,
    )
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;
    win.set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())?;
    if used_fallback {
        if let Err(error) = persist_tauri_floating_position(&app, x, y) {
            eprintln!("[floating] failed to persist fallback position: {}", error);
        }
    }
    win.show().map_err(|e| e.to_string())?;
    win.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn close_floating_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("floating") {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn save_floating_window_position(app: tauri::AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window("floating")
        .ok_or_else(|| "悬浮窗不可用".to_string())?;
    let position = win.outer_position().map_err(|error| error.to_string())?;
    persist_tauri_floating_position(&app, position.x, position.y)
}

#[tauri::command]
async fn reset_floating_window_position(app: tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("floating").is_none() {
        open_floating_window(app.clone()).await?;
    }
    let win = app
        .get_webview_window("floating")
        .ok_or_else(|| "悬浮窗不可用".to_string())?;
    let previous = win.outer_position().map_err(|error| error.to_string())?;
    let (x, y) = primary_floating_position(&app, floating_window_size(&app))?;
    win.set_position(PhysicalPosition::new(x, y))
        .map_err(|error| error.to_string())?;
    if let Err(error) = persist_tauri_floating_position(&app, x, y) {
        let _ = win.set_position(previous);
        return Err(error);
    }
    win.show().map_err(|error| error.to_string())?;
    win.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
async fn set_floating_window_style(app: tauri::AppHandle, style: String) -> Result<(), String> {
    app.emit_to(
        EventTarget::webview_window("floating"),
        "floating-window-style-changed",
        style,
    )
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn set_floating_window_size(app: tauri::AppHandle, size: f64) -> Result<i32, String> {
    let size = normalize_floating_window_size(Some(size));
    let Some(win) = app.get_webview_window("floating") else {
        return Ok(size);
    };

    let previous_position = win.outer_position().map_err(|error| error.to_string())?;
    let previous_size = win.outer_size().map_err(|error| error.to_string())?;
    let scale_factor = win.scale_factor().map_err(|error| error.to_string())?;
    let physical_size = (size as f64 * scale_factor).round() as i32;
    let (mut x, mut y) = resize_floating_window_position(
        previous_position.x,
        previous_position.y,
        previous_size.width as i32,
        physical_size,
    );
    let center_x = previous_position
        .x
        .saturating_add(previous_size.width as i32 / 2);
    let center_y = previous_position
        .y
        .saturating_add(previous_size.height as i32 / 2);
    let work_areas = floating_work_areas(&app)?;
    if let Some((work_x, work_y, work_width, work_height, _)) =
        floating_work_area_for_center(&work_areas, center_x, center_y)
    {
        (x, y) = constrain_floating_window_position(
            x,
            y,
            physical_size,
            work_x,
            work_y,
            work_width,
            work_height,
        );
    } else {
        (x, y) = primary_floating_position(&app, size)?;
    }

    win.set_size(LogicalSize::new(size as f64, size as f64))
        .map_err(|error| error.to_string())?;
    if let Err(error) = win.set_position(PhysicalPosition::new(x, y)) {
        let _ = win.set_size(previous_size);
        let _ = win.set_position(previous_position);
        return Err(error.to_string());
    }
    if let Err(error) = persist_tauri_floating_position(&app, x, y) {
        let _ = win.set_size(previous_size);
        let _ = win.set_position(previous_position);
        return Err(error);
    }
    app.emit_to(
        EventTarget::webview_window("floating"),
        "floating-window-size-changed",
        size,
    )
    .map_err(|error| error.to_string())?;
    Ok(size)
}

#[tauri::command]
async fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    request_reveal_main_window(&app)
}

#[tauri::command]
async fn hide_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn reveal_file(path: String) -> bool {
    let path = PathBuf::from(path);
    #[cfg(target_os = "windows")]
    {
        return background_command("explorer")
            .arg("/select,")
            .arg(path)
            .spawn()
            .is_ok();
    }
    #[cfg(target_os = "macos")]
    {
        return Command::new("open")
            .args(["-R", path.to_string_lossy().as_ref()])
            .spawn()
            .is_ok();
    }
    #[cfg(target_os = "linux")]
    {
        return Command::new("xdg-open")
            .arg(path.parent().unwrap_or(Path::new(".")))
            .spawn()
            .is_ok();
    }
}

#[tauri::command]
fn show_data_location(store: State<'_, EncryptedStore>) -> bool {
    reveal_file(store.path.to_string_lossy().into_owned())
}

#[tauri::command]
fn system_accent() -> String {
    #[cfg(target_os = "windows")]
    {
        let queries = [
            (
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Accent",
                "AccentColorMenu",
            ),
            (r"HKCU\Software\Microsoft\Windows\DWM", "AccentColor"),
        ];
        for (key, value_name) in queries {
            if let Ok(output) = background_command("reg")
                .args(["query", key, "/v", value_name])
                .output()
            {
                let text = String::from_utf8_lossy(&output.stdout);
                if let Some(raw) = text.split_whitespace().find(|part| part.starts_with("0x")) {
                    if let Ok(value) = u32::from_str_radix(raw.trim_start_matches("0x"), 16) {
                        let red = value & 0xff;
                        let green = (value >> 8) & 0xff;
                        let blue = (value >> 16) & 0xff;
                        return format!("#{:02x}{:02x}{:02x}", red, green, blue);
                    }
                }
            }
        }
    }
    "#ea5ec1".into()
}

#[cfg(target_os = "windows")]
fn startup_task_action() -> Result<String, String> {
    let executable = std::env::current_exe().map_err(|error| error.to_string())?;
    Ok(format!(
        "\"{}\" --cyrene-autostart",
        executable.to_string_lossy()
    ))
}

#[tauri::command]
fn read_dropped_file(path: String) -> Result<serde_json::Value, String> {
    let path = PathBuf::from(path);
    if !path.is_file() {
        return Err("拖入的路径不是文件".into());
    }
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    if metadata.len() > 64 * 1024 * 1024 {
        return Err("文件过大，最多支持 64 MB".into());
    }
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let name = path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("import")
        .to_string();
    let extension = path
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or("")
        .to_ascii_lowercase();
    Ok(serde_json::json!({
        "name": name,
        "extension": extension,
        "path": path.to_string_lossy(),
        "base64": base64::engine::general_purpose::STANDARD.encode(bytes)
    }))
}

#[cfg(target_os = "windows")]
fn startup_registry_action() -> Result<String, String> {
    startup_task_action()
}

fn configure_startup_task(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if !enabled {
            let query = background_command("schtasks")
                .args(["/Query", "/TN", STARTUP_TASK_NAME])
                .output()
                .map_err(|error| error.to_string())?;
            if !query.status.success() {
                return Ok(());
            }
        }
        let output = if enabled {
            background_command("schtasks")
                .args([
                    "/Create",
                    "/TN",
                    STARTUP_TASK_NAME,
                    "/TR",
                    &startup_task_action()?,
                    "/SC",
                    "ONLOGON",
                    "/RL",
                    "HIGHEST",
                    "/F",
                ])
                .output()
        } else {
            background_command("schtasks")
                .args(["/Delete", "/TN", STARTUP_TASK_NAME, "/F"])
                .output()
        }
        .map_err(|error| error.to_string())?;
        if output.status.success() {
            return Ok(());
        }
        let error = String::from_utf8_lossy(if output.stderr.is_empty() {
            &output.stdout
        } else {
            &output.stderr
        });
        return Err(error.trim().to_string());
    }
    #[cfg(target_os = "linux")]
    {
        let _ = enabled;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Err("管理员计划任务仅支持 Windows".into())
}

fn configure_registry_startup(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if !enabled {
            let query = background_command("reg")
                .args([
                    "query",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    STARTUP_REGISTRY_VALUE,
                ])
                .output()
                .map_err(|error| error.to_string())?;
            if !query.status.success() {
                return Ok(());
            }
        }
        let mut command = background_command("reg");
        command.args([
            if enabled { "add" } else { "delete" },
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            STARTUP_REGISTRY_VALUE,
        ]);
        if enabled {
            command.args(["/t", "REG_SZ", "/d", &startup_registry_action()?, "/f"]);
        } else {
            command.arg("/f");
        }
        let output = command.output().map_err(|error| error.to_string())?;
        if output.status.success() {
            return Ok(());
        }
        let error = String::from_utf8_lossy(if output.stderr.is_empty() {
            &output.stdout
        } else {
            &output.stderr
        });
        return Err(error.trim().to_string());
    }
    #[cfg(target_os = "linux")]
    {
        let _ = enabled;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Err("传统启动项当前仅支持 Windows".into())
}

fn configure_auto_start(enabled: bool, mode: &str, previous_mode: &str) -> Result<(), String> {
    if !enabled {
        if mode == "scheduled" || previous_mode == "scheduled" {
            configure_startup_task(false)?;
        }
        configure_registry_startup(false)?;
        return Ok(());
    }
    match mode {
        "scheduled" => {
            configure_registry_startup(false)?;
            configure_startup_task(true)
        }
        "registry" => {
            if previous_mode == "scheduled" {
                configure_startup_task(false)?;
            }
            configure_registry_startup(true)
        }
        _ => Err("未知的开机启动方式".into()),
    }
}

fn process_is_elevated() -> bool {
    #[cfg(target_os = "windows")]
    {
        return unsafe { IsUserAnAdmin() != 0 };
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

fn home_dir() -> PathBuf {
    if cfg!(target_os = "windows") {
        PathBuf::from(std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users\\Public".into()))
    } else {
        PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| "/tmp".into()))
    }
}

fn autostart_desktop_path() -> PathBuf {
    home_dir().join(".config").join("autostart").join("cyrene-name-roller.desktop")
}

fn autostart_desktop_content(executable: &str) -> String {
    format!(
        "[Desktop Entry]\nType=Application\nName=Cyreneの随机点名器\nExec=\"{}\" --cyrene-autostart\nIcon=cyrene-name-roller\nTerminal=false\nX-GNOME-Autostart-enabled=true\n",
        executable
    )
}

#[cfg(target_os = "linux")]
fn configure_autostart_desktop_entry(enabled: bool) -> Result<(), String> {
    let path = autostart_desktop_path();
    if !enabled {
        if path.exists() {
            fs::remove_file(&path).map_err(|error| error.to_string())?;
        }
        return Ok(());
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let executable = std::env::current_exe().map_err(|error| error.to_string())?;
    fs::write(&path, autostart_desktop_content(&executable.to_string_lossy())).map_err(|error| error.to_string())?;
    Ok(())
}

fn linux_applications_dir() -> PathBuf {
    home_dir().join(".local").join("share").join("applications")
}

fn uri_desktop_path() -> PathBuf {
    linux_applications_dir().join("cyrene-name-roller-uri.desktop")
}

fn uri_desktop_content(executable: &str) -> String {
    format!(
        "[Desktop Entry]\nType=Application\nName=Cyreneの随机点名器 (URI Handler)\nExec=\"{}\" \"%1\"\nIcon=cyrene-name-roller\nTerminal=false\nNoDisplay=true\nMimeType=x-scheme-handler/{};\n",
        executable, URI_SCHEME
    )
}

#[cfg(target_os = "linux")]
fn configure_uri_desktop_entry(enabled: bool) -> Result<(), String> {
    let path = uri_desktop_path();
    if !enabled {
        if path.exists() {
            fs::remove_file(&path).map_err(|error| error.to_string())?;
        }
        return Ok(());
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let executable = std::env::current_exe().map_err(|error| error.to_string())?;
    fs::write(&path, uri_desktop_content(&executable.to_string_lossy())).map_err(|error| error.to_string())?;

    let _ = background_command("update-desktop-database")
        .arg(linux_applications_dir())
        .status();
    let _ = background_command("xdg-mime")
        .args(["default", &path.to_string_lossy(), &format!("x-scheme-handler/{}", URI_SCHEME)])
        .status();
    Ok(())
}

#[tauri::command]
fn is_process_elevated() -> bool {
    process_is_elevated()
}

#[tauri::command]
async fn set_auto_start(
    enabled: bool,
    mode: String,
    previous_mode: String,
) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "windows")]
    {
        let needs_scheduled_privilege = mode == "scheduled"
            || previous_mode == "scheduled" && (!enabled || mode != previous_mode);
        if needs_scheduled_privilege && !process_is_elevated() {
            return Ok(serde_json::json!({
                "success": false,
                "requiresElevation": true,
                "error": "需要管理员权限修改计划任务"
            }));
        }
        tauri::async_runtime::spawn_blocking(move || {
            configure_auto_start(enabled, &mode, &previous_mode)
        })
        .await
        .map_err(|error| error.to_string())??;
        return Ok(serde_json::json!({ "success": true, "restarting": false }));
    }
    #[cfg(target_os = "linux")]
    {
        let _ = previous_mode;
        tauri::async_runtime::spawn_blocking(move || configure_autostart_desktop_entry(enabled))
            .await
            .map_err(|error| error.to_string())??;
        return Ok(serde_json::json!({ "success": true, "restarting": false }));
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Ok(serde_json::json!({ "success": false, "error": "当前系统暂不支持开机启动设置" }))
}

#[tauri::command]
fn restart_elevated_for_auto_start(
    enabled: bool,
    mode: String,
    previous_mode: String,
) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "windows")]
    {
        if mode != "scheduled" && mode != "registry" {
            return Err("未知的开机启动方式".into());
        }
        let executable = std::env::current_exe().map_err(|error| error.to_string())?;
        let parameters = format!(
            "--cyrene-configure-autostart={} --cyrene-autostart-mode={} --cyrene-previous-autostart-mode={} --cyrene-replace-pid={}",
            if enabled { "enable" } else { "disable" },
            mode,
            previous_mode,
            std::process::id()
        );
        if let Err(error) = shell_execute("runas", executable.as_os_str(), Some(&parameters)) {
            return Ok(serde_json::json!({ "success": false, "error": error }));
        }
        return Ok(serde_json::json!({ "success": true, "restarting": true }));
    }
    #[cfg(not(target_os = "windows"))]
    Ok(serde_json::json!({ "success": false, "error": "管理员计划任务仅支持 Windows" }))
}

#[tauri::command]
fn is_autostart_launch() -> bool {
    std::env::args().any(|arg| arg == "--cyrene-autostart")
}

#[tauri::command]
fn set_uri_scheme_enabled(enabled: bool) -> Result<serde_json::Value, String> {
    #[cfg(target_os = "windows")]
    {
        let key = format!(r"HKCU\Software\Classes\{}", URI_SCHEME);
        if enabled {
            let executable = std::env::current_exe().map_err(|error| error.to_string())?;
            let executable = executable.to_string_lossy().to_string();
            let registrations = [
                (key.clone(), None, format!("URL:{} protocol", URI_SCHEME)),
                (key.clone(), Some("URL Protocol"), String::new()),
                (
                    format!(r"{}\DefaultIcon", key),
                    None,
                    format!("\"{}\",0", executable),
                ),
                (
                    format!(r"{}\shell\open\command", key),
                    None,
                    format!("\"{}\" \"%1\"", executable),
                ),
            ];
            for (path, name, value) in registrations {
                let mut command = background_command("reg");
                command.args(["add", &path]);
                if let Some(name) = name {
                    command.args(["/v", name]);
                } else {
                    command.arg("/ve");
                }
                let output = command
                    .args(["/t", "REG_SZ", "/d", &value, "/f"])
                    .output()
                    .map_err(|error| error.to_string())?;
                if !output.status.success() {
                    let error = String::from_utf8_lossy(if output.stderr.is_empty() {
                        &output.stdout
                    } else {
                        &output.stderr
                    });
                    return Err(error.trim().to_string());
                }
            }
        } else {
            let query = background_command("reg")
                .args(["query", &key])
                .output()
                .map_err(|error| error.to_string())?;
            if !query.status.success() {
                return Ok(serde_json::json!({ "success": true, "enabled": false }));
            }
            let output = background_command("reg")
                .args(["delete", &key, "/f"])
                .output()
                .map_err(|error| error.to_string())?;
            if !output.status.success() {
                let error = String::from_utf8_lossy(if output.stderr.is_empty() {
                    &output.stdout
                } else {
                    &output.stderr
                });
                return Err(error.trim().to_string());
            }
        }
        return Ok(serde_json::json!({ "success": true, "enabled": enabled }));
    }
    #[cfg(target_os = "linux")]
    {
        configure_uri_desktop_entry(enabled)?;
        return Ok(serde_json::json!({ "success": true, "enabled": enabled }));
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Ok(serde_json::json!({
        "success": false,
        "enabled": false,
        "error": "当前系统暂不支持 URI 协议注册"
    }))
}

#[tauri::command]
fn is_uri_scheme_enabled() -> bool {
    #[cfg(target_os = "windows")]
    {
        let key = format!(r"HKCU\Software\Classes\{}\shell\open\command", URI_SCHEME);
        let Ok(output) = background_command("reg")
            .args(["query", &key, "/ve"])
            .output()
        else {
            return false;
        };
        if !output.status.success() {
            return false;
        }
        let executable = std::env::current_exe()
            .ok()
            .map(|path| path.to_string_lossy().to_ascii_lowercase());
        let output = String::from_utf8_lossy(&output.stdout).to_ascii_lowercase();
        executable.is_some_and(|path| output.contains(&path))
    }
    #[cfg(target_os = "linux")]
    {
        let path = uri_desktop_path();
        let Ok(content) = fs::read_to_string(&path) else {
            return false;
        };
        content.contains("MimeType=x-scheme-handler/cyrenenr;")
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    false
}

#[tauri::command]
async fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<MainWindowRevealState>()
        .pending
        .store(false, Ordering::Release);
    show_main_window_now(&app)
}

#[tauri::command]
fn main_window_ready(app: tauri::AppHandle) -> Result<bool, String> {
    let state = app.state::<MainWindowRevealState>();
    state.frontend_ready.store(true, Ordering::Release);
    if state.pending.load(Ordering::Acquire) {
        app.emit("main-window-show-requested", ())
            .map_err(|error| error.to_string())?;
    }
    let uri_state = app.state::<UriRequestState>();
    uri_state.frontend_ready.store(true, Ordering::Release);
    let pending = std::mem::take(
        &mut *uri_state
            .pending
            .lock()
            .map_err(|_| "URI 请求队列锁定失败".to_string())?,
    );
    let had_pending_uri = !pending.is_empty();
    for uri in pending {
        app.emit("uri-open-requested", uri)
            .map_err(|error| error.to_string())?;
    }
    Ok(had_pending_uri)
}

fn show_main_window_now(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.unminimize().map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn request_reveal_main_window(app: &tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<MainWindowRevealState>();
    state.pending.store(true, Ordering::Release);
    if state.frontend_ready.load(Ordering::Acquire) {
        app.emit("main-window-show-requested", ())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

// 构建系统托盘：左键无菜单，右键弹出“显示主窗口 / 退出”
fn create_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().unwrap())
        .tooltip("Cyreneの随机点名器")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            // 左键单击托盘图标：直接显示主界面
            if let tauri::tray::TrayIconEvent::Click {
                button,
                button_state,
                ..
            } = event
            {
                if button == tauri::tray::MouseButton::Left
                    && button_state == tauri::tray::MouseButtonState::Up
                {
                    let _ = request_reveal_main_window(tray.app_handle());
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                let _ = request_reveal_main_window(app);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let arguments: Vec<String> = std::env::args().collect();
    let launch_uri = launch_uri_from_arguments(&arguments);
    let replacing_instance = arguments
        .iter()
        .any(|argument| argument.starts_with("--cyrene-replace-pid="));
    if let Some(configuration) = arguments
        .iter()
        .find(|argument| argument.starts_with("--cyrene-configure-autostart="))
    {
        let mode = arguments
            .iter()
            .find_map(|argument| argument.strip_prefix("--cyrene-autostart-mode="))
            .unwrap_or("scheduled");
        let previous_mode = arguments
            .iter()
            .find_map(|argument| argument.strip_prefix("--cyrene-previous-autostart-mode="))
            .unwrap_or(mode);
        if let Err(error) =
            configure_auto_start(configuration.ends_with("=enable"), mode, previous_mode)
        {
            eprintln!("[startup-task] {}", error);
            std::process::exit(2);
        }
        if replacing_instance {
            let _ = request_existing_instance_exit();
        }
    }
    let instance_listener = acquire_instance_listener(replacing_instance, launch_uri.as_deref());
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            let data_path = app
                .path()
                .app_data_dir()?
                .join("data")
                .join("cyrene-data.cyrene");
            app.manage(EncryptedStore::load(data_path));
            app.manage(MainWindowRevealState::new());
            app.manage(UriRequestState::new());
            let handle = app.handle().clone();
            start_instance_listener(instance_listener, handle.clone());
            if let Some(uri) = launch_uri.clone() {
                let _ = request_open_uri(&handle, uri);
            }
            migrate_legacy_data(&handle);
            restore_window_state(&handle);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            create_tray(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let win = window.clone();
                let save_revision = Arc::new(AtomicU64::new(0));
                window.on_window_event(move |event| match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        // 关闭时最小化到托盘，不退出进程（后台常驻）
                        api.prevent_close();
                        save_window_state(&handle);
                        let _ = win.hide();
                    }
                    tauri::WindowEvent::Resized(_) => {
                        let revision = save_revision.fetch_add(1, Ordering::Relaxed) + 1;
                        let revision_state = save_revision.clone();
                        let save_handle = handle.clone();
                        std::thread::spawn(move || {
                            std::thread::sleep(std::time::Duration::from_millis(350));
                            if revision_state.load(Ordering::Relaxed) == revision {
                                save_window_state(&save_handle);
                            }
                        });
                    }
                    _ => {}
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            storage_get,
            storage_set,
            storage_delete,
            storage_clear,
            export_encrypted_data,
            import_encrypted_data,
            export_data_file,
            import_data_file,
            save_text_file,
            open_text_file,
            plugin_select_file,
            plugin_select_directory,
            plugin_execute_operation,
            read_dropped_file,
            load_names,
            load_changelog,
            check_update,
            open_external,
            show_data_location,
            reveal_file,
            system_accent,
            set_uri_scheme_enabled,
            is_uri_scheme_enabled,
            set_auto_start,
            restart_elevated_for_auto_start,
            is_process_elevated,
            is_autostart_launch,
            fetch_announcements,
            download_and_launch_update,
            open_floating_window,
            close_floating_window,
            save_floating_window_position,
            reset_floating_window_position,
            set_floating_window_style,
            set_floating_window_size,
            focus_main_window,
            hide_to_tray,
            main_window_ready,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{
        center_floating_window, constrain_floating_window_position,
        floating_window_position_visible, is_cyrene_uri, launch_uri_from_arguments,
        normalize_floating_window_size, resize_floating_window_position,
    };

    #[test]
    fn uri_arguments_only_accept_the_cyrene_scheme() {
        let arguments = vec![
            "CyreneNameRoller.exe".to_string(),
            "cyrenenr://page/roller?count=6".to_string(),
        ];
        assert_eq!(
            launch_uri_from_arguments(&arguments).as_deref(),
            Some("cyrenenr://page/roller?count=6")
        );
        assert!(is_cyrene_uri("CYRENENR://start"));
        assert!(!is_cyrene_uri("https://example.com"));
        assert!(!is_cyrene_uri("cyrenenr:/start"));
    }

    #[test]
    fn floating_window_size_normalizes_to_supported_steps() {
        assert_eq!(normalize_floating_window_size(None), 64);
        assert_eq!(normalize_floating_window_size(Some(20.0)), 40);
        assert_eq!(normalize_floating_window_size(Some(66.0)), 68);
        assert_eq!(normalize_floating_window_size(Some(200.0)), 200);
        assert_eq!(normalize_floating_window_size(Some(300.0)), 256);
    }

    #[test]
    fn floating_window_centers_in_offset_work_area() {
        assert_eq!(
            center_floating_window(1920, 40, 1920, 1040, 1.0, 64),
            (2848, 528)
        );
    }

    #[test]
    fn floating_window_centers_logical_size_at_high_dpi() {
        assert_eq!(
            center_floating_window(0, 0, 1920, 1080, 1.5, 64),
            (912, 492)
        );
    }

    #[test]
    fn floating_window_accepts_positive_overlap() {
        assert!(floating_window_position_visible(
            1919,
            100,
            &[(0, 0, 1920, 1080, 1.0)],
            64
        ));
    }

    #[test]
    fn floating_window_rejects_off_screen_position() {
        assert!(!floating_window_position_visible(
            3000,
            100,
            &[(0, 0, 1920, 1080, 1.0)],
            64
        ));
    }

    #[test]
    fn floating_window_centers_requested_logical_size() {
        assert_eq!(
            center_floating_window(0, 0, 1920, 1080, 1.0, 128),
            (896, 476)
        );
    }

    #[test]
    fn floating_window_visibility_uses_requested_logical_size() {
        assert!(floating_window_position_visible(
            -100,
            100,
            &[(-0, 0, 1920, 1080, 1.0)],
            128
        ));
        assert!(!floating_window_position_visible(
            -100,
            100,
            &[(0, 0, 1920, 1080, 1.0)],
            40
        ));
    }

    #[test]
    fn floating_window_resizes_around_physical_center() {
        assert_eq!(
            resize_floating_window_position(100, 200, 64, 128),
            (68, 168)
        );
        assert_eq!(
            resize_floating_window_position(68, 168, 128, 40),
            (112, 212)
        );
    }

    #[test]
    fn floating_window_constrains_into_physical_work_area() {
        assert_eq!(
            constrain_floating_window_position(-20, 1070, 128, 0, 40, 1920, 1040),
            (0, 952)
        );
    }
}
