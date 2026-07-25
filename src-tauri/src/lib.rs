use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::{Aead, OsRng, rand_core::RngCore};
use base64::Engine;
use sha2::{Digest, Sha256};
use std::sync::Mutex;
use tauri::{Emitter, LogicalSize, Manager, State};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const UPDATE_PROXY_BASE: &str = "https://gh.xn--8hvv1o.cn/";
const UPDATE_URL_PREFIX: &str = "https://github.com/Cyrene2008/CyreneNameRoller/releases/download/";
const MIN_INSTALLER_SIZE: usize = 1024 * 1024;
const DATA_MAGIC: &[u8] = b"CYRENE1\0";
const DATA_NONCE_LENGTH: usize = 12;
const DATA_TAG_LENGTH: usize = 16;

struct EncryptedStore {
    path: PathBuf,
    values: Mutex<serde_json::Value>,
    integrity_error: Mutex<Option<String>>,
}

impl EncryptedStore {
    fn load() -> Self {
        let path = installation_data_dir().join("cyrene-data.cyrene");
        let (values, integrity_error) = match fs::read(&path) {
            Ok(bytes) => match decrypt_data(&bytes) {
                Ok(values) => (values, None),
                Err(error) => (serde_json::json!({}), Some(error)),
            },
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => (serde_json::json!({}), None),
            Err(error) => (serde_json::json!({}), Some(error.to_string())),
        };
        Self { path, values: Mutex::new(values), integrity_error: Mutex::new(integrity_error) }
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
        let values = self.values.lock().map_err(|_| "数据锁定失败".to_string())?.clone();
        let temporary_path = self.path.with_extension("cyrene.tmp");
        fs::write(&temporary_path, encrypt_data(&values)?)
            .map_err(|error| error.to_string())?;
        fs::rename(&temporary_path, &self.path).map_err(|error| error.to_string())
    }
}

fn installation_data_dir() -> PathBuf {
    let root = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    let dir = root.join("data");
    fs::create_dir_all(&dir).ok();
    dir
}

fn get_resource_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir().unwrap_or_else(|_| PathBuf::from("."))
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
    let encrypted = cipher.encrypt(Nonce::from_slice(&nonce), plain.as_ref()).map_err(|error| error.to_string())?;
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
        .decrypt(Nonce::from_slice(&bytes[nonce_start..nonce_end]), &bytes[nonce_end..])
        .map_err(|_| "数据完整性校验失败，文件可能已被篡改".to_string())?;
    let values: serde_json::Value = serde_json::from_slice(&plain).map_err(|_| "数据内容无效".to_string())?;
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

// 启动时恢复上次记忆的窗口尺寸与位置
fn restore_window_state(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let store = app.state::<EncryptedStore>();
        if let Ok(values) = store.values.lock() {
            let state = &values["windowState"];
            if let (Some(w), Some(h)) = (state["width"].as_u64(), state["height"].as_u64()) {
                let _ = window.set_size(tauri::PhysicalSize::new(w as u32, h as u32));
            }
            if state["isMaximized"].as_bool() == Some(true) {
                let _ = window.maximize();
            }
        };
    }
}

async fn download_installer_bytes(
    app: &tauri::AppHandle,
    url: &str,
    expected_size: u64,
) -> Result<Vec<u8>, String> {
    if !url.starts_with(UPDATE_URL_PREFIX) {
        return Err("更新地址不属于 CyreneNameRoller 官方发布源".into());
    }
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(15))
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    let urls = [format!("{}{}", UPDATE_PROXY_BASE, url), url.to_string()];
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
                                let progress = ((bytes.len() as u64 * 99) / total_size).min(99) as u8;
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
        Command::new(path).spawn().map(|_| ()).map_err(|error| error.to_string())
    }
    #[cfg(target_os = "macos")]
    { Command::new("open").arg(path).spawn().map(|_| ()).map_err(|error| error.to_string()) }
    #[cfg(target_os = "linux")]
    { Command::new("xdg-open").arg(path).spawn().map(|_| ()).map_err(|error| error.to_string()) }
}

#[tauri::command]
fn storage_get(store: State<'_, EncryptedStore>, key: String) -> Option<serde_json::Value> {
    if store.is_healthy().is_err() {
        return None;
    }
    store.values.lock().ok().and_then(|values| values.get(&key).cloned())
}

fn migrate_legacy_data(app: &tauri::AppHandle) {
    let store = app.state::<EncryptedStore>();
    if store.path.exists() || store.is_healthy().is_err() {
        return;
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
            let Ok(raw) = fs::read_to_string(&path) else { continue };
            let Ok(value) = serde_json::from_str::<serde_json::Value>(&raw) else { continue };
            let Some(stem) = path.file_stem().and_then(|stem| stem.to_str()) else { continue };
            if stem == "window-state" {
                values.insert("windowState".into(), serde_json::json!({
                    "width": value["width"],
                    "height": value["height"],
                    "isMaximized": value["maximized"].as_bool().unwrap_or(false),
                }));
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
        legacy_paths.into_iter().for_each(|path| { let _ = fs::remove_file(path); });
    }
}

#[tauri::command]
fn storage_set(store: State<'_, EncryptedStore>, key: String, value: serde_json::Value) -> bool {
    if store.is_healthy().is_err() {
        return false;
    }
    if let Ok(mut values) = store.values.lock() {
        if let Some(object) = values.as_object_mut() {
            object.insert(key, value);
        } else {
            return false;
        }
    } else {
        return false;
    }
    store.persist().is_ok()
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
fn import_encrypted_data(store: State<'_, EncryptedStore>, encoded_data: String) -> Result<bool, String> {
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
        "https://api.github.com/repos/Cyrene2008/CyreneNameRoller/releases/latest",
        "https://api.kkgithub.com/repos/Cyrene2008/CyreneNameRoller/releases/latest",
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
    { let _ = Command::new("cmd").args(["/C", "start", &url]).spawn(); }
    #[cfg(target_os = "macos")]
    { let _ = Command::new("open").arg(&url).spawn(); }
    #[cfg(target_os = "linux")]
    { let _ = Command::new("xdg-open").arg(&url).spawn(); }
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
        "https://gh.xn--8hvv1o.cn/raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/refs/heads/master/.announcement/latest.json",
        // 自建 nameapi 镜像
        "https://nameapi.cyrene.hi.cn/announcement/latest.json",
        // 直连 raw.githubusercontent 兜底
        "https://raw.githubusercontent.com/Cyrene2008/CyreneNameRoller/master/.announcement/latest.json",
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
) -> Result<serde_json::Value, String> {
    let bytes = download_installer_bytes(&app, &url, expected_size).await?;
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
    if let Some(win) = app.get_webview_window("floating") {
        win.set_size(LogicalSize::new(64.0, 64.0)).map_err(|e| e.to_string())?;
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    tauri::WebviewWindowBuilder::new(
        &app,
        "floating",
        tauri::WebviewUrl::App("index.html#/floating".into()),
    )
    .always_on_top(true)
    .decorations(false)
    .shadow(false)
    .resizable(false)
    .transparent(true)
    .inner_size(64.0, 64.0)
    .min_inner_size(64.0, 64.0)
    .max_inner_size(64.0, 64.0)
    .build()
    .map_err(|e| e.to_string())?;
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
async fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.unminimize().map_err(|e| e.to_string())?;
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_data_location() {
    #[cfg(target_os = "windows")]
    { let _ = Command::new("explorer").arg("/select,").arg(installation_data_dir().join("cyrene-data.cyrene")).spawn(); }
}

#[tauri::command]
fn set_auto_start(enabled: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let task = "CyreneNameRollerAutoStart";
        let command = if enabled {
            let exe = std::env::current_exe().map_err(|error| error.to_string())?;
            format!("schtasks /Create /TN \"{}\" /TR '\"{}\" --cyrene-autostart' /SC ONLOGON /RL HIGHEST /F", task, exe.to_string_lossy())
        } else { format!("schtasks /Delete /TN \"{}\" /F", task) };
        Command::new("powershell").args(["-NoProfile", "-Command", &format!("Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command {}'", command.replace("'", "''"))]).spawn().map_err(|error| error.to_string())?;
    }
    Ok(true)
}

#[tauri::command]
fn is_autostart_launch() -> bool { std::env::args().any(|arg| arg == "--cyrene-autostart") }

#[tauri::command]
async fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
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
                    if let Some(w) = tray.app_handle().get_webview_window("main") {
                        let _ = w.show();
                        let _ = w.unminimize();
                        let _ = w.set_focus();
                    }
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(EncryptedStore::load())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            let handle = app.handle().clone();
            migrate_legacy_data(&handle);
            restore_window_state(&handle);
            create_tray(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let win = window.clone();
                window.on_window_event(move |event| match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        // 关闭时最小化到托盘，不退出进程（后台常驻）
                        api.prevent_close();
                        let _ = win.hide();
                    }
                    tauri::WindowEvent::Resized(_) | tauri::WindowEvent::Moved(_) => {
                        save_window_state(&handle);
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
            load_names,
            load_changelog,
            check_update,
            open_external,
            show_data_location,
            set_auto_start,
            is_autostart_launch,
            fetch_announcements,
            download_and_launch_update,
            open_floating_window,
            close_floating_window,
            focus_main_window,
            hide_to_tray,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
