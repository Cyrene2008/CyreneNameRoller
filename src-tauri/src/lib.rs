use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const UPDATE_PROXY_BASE: &str = "https://gh.xn--8hvv1o.cn/";
const UPDATE_URL_PREFIX: &str = "https://github.com/Cyrene2008/CyreneNameRoller/releases/download/";
const MIN_INSTALLER_SIZE: usize = 1024 * 1024;

fn get_data_dir(app: &tauri::AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from(".")).join("data");
    fs::create_dir_all(&dir).ok();
    dir
}

fn get_resource_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn window_state_path(app: &tauri::AppHandle) -> PathBuf {
    get_data_dir(app).join("window-state.json")
}

// 保存主窗口的尺寸、位置与最大化状态，供下次启动恢复
fn save_window_state(app: &tauri::AppHandle) {
    let windows = app.webview_windows();
    if let Some(window) = windows.values().next() {
        if let (Ok(size), Ok(pos)) = (window.outer_size(), window.outer_position()) {
            let state = serde_json::json!({
                "width": size.width,
                "height": size.height,
                "x": pos.x,
                "y": pos.y,
                "maximized": window.is_maximized().unwrap_or(false),
            });
            let _ = fs::write(
                window_state_path(app),
                serde_json::to_string_pretty(&state).unwrap_or_default(),
            );
        }
    }
}

// 启动时恢复上次记忆的窗口尺寸与位置
fn restore_window_state(app: &tauri::AppHandle) {
    let windows = app.webview_windows();
    if let Some(window) = windows.values().next() {
        let path = window_state_path(app);
        if let Ok(s) = fs::read_to_string(&path) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                if let (Some(w), Some(h)) = (v["width"].as_u64(), v["height"].as_u64()) {
                    let _ = window.set_size(tauri::PhysicalSize::new(w as u32, h as u32));
                }
                if let (Some(x), Some(y)) = (v["x"].as_i64(), v["y"].as_i64()) {
                    let _ = window.set_position(tauri::PhysicalPosition::new(x as i32, y as i32));
                }
                if v["maximized"].as_bool() == Some(true) {
                    let _ = window.maximize();
                }
            }
        }
    }
}

async fn download_installer_bytes(url: &str, expected_size: u64) -> Result<Vec<u8>, String> {
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
            Ok(resp) if resp.status().is_success() => {
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

                match resp.bytes().await {
                    Ok(bytes) => {
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
                        return Ok(bytes.to_vec());
                    }
                    Err(error) => failures.push(error.to_string()),
                }
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
fn storage_get(app: tauri::AppHandle, key: String) -> Option<serde_json::Value> {
    let path = get_data_dir(&app).join(format!("{}.json", key));
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

#[tauri::command]
fn storage_set(app: tauri::AppHandle, key: String, value: serde_json::Value) -> bool {
    let path = get_data_dir(&app).join(format!("{}.json", key));
    fs::write(&path, serde_json::to_string_pretty(&value).unwrap_or_default()).is_ok()
}

#[tauri::command]
fn storage_delete(app: tauri::AppHandle, key: String) -> bool {
    let path = get_data_dir(&app).join(format!("{}.json", key));
    fs::remove_file(&path).is_ok()
}

#[tauri::command]
fn storage_clear(app: tauri::AppHandle) -> bool {
    let dir = get_data_dir(&app);
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if entry.path().extension().map_or(false, |e| e == "json") {
                fs::remove_file(entry.path()).ok();
            }
        }
    }
    true
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
    let bytes = download_installer_bytes(&url, expected_size).await?;
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
            load_names,
            load_changelog,
            check_update,
            open_external,
            fetch_announcements,
            download_and_launch_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
