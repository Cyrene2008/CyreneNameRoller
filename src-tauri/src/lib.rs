use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

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

// 通过代理（或直连）下载文件字节，优先走国内可访问的镜像代理
async fn download_bytes(url: &str) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;
    let proxied = format!("https://gh.xn--8hvv1o.cn/{}", url);
    for u in [proxied, url.to_string()] {
        if let Ok(resp) = client
            .get(&u)
            .header("User-Agent", "CyreneNameRoller")
            .send()
            .await
        {
            if resp.status().is_success() {
                if let Ok(bytes) = resp.bytes().await {
                    return Ok(bytes.to_vec());
                }
            }
        }
    }
    Err("下载失败，请检查网络或稍后重试".into())
}

// 弹出原生保存对话框（回调式，用通道桥接为同步返回，避免阻塞事件循环）
fn pick_save_path(app: &tauri::AppHandle, file_name: &str) -> Option<PathBuf> {
    use tauri_plugin_dialog::{DialogExt, FilePath};
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .set_title("保存安装程序")
        .set_file_name(file_name)
        .add_filter("安装程序", &["exe"])
        .save_file(move |path: Option<FilePath>| {
            let _ = tx.send(path);
        });
    rx.recv().ok().flatten().and_then(|p| p.into_path().ok())
}

// 下载完成后启动安装程序：优先用 explorer（会等待退出，规避 SmartScreen 拦截），失败回退
fn launch_installer(path: &str) {
    #[cfg(target_os = "windows")]
    {
        if Command::new("explorer").arg(path).status().is_ok() {
            return;
        }
        let _ = Command::new("cmd").args(["/C", "start", "", path]).spawn();
    }
    #[cfg(target_os = "macos")]
    { let _ = Command::new("open").arg(path).spawn(); }
    #[cfg(target_os = "linux")]
    { let _ = Command::new("xdg-open").arg(path).spawn(); }
}

// 让安装程序在保存对话框彻底关闭、窗口重新获焦后再启动，避免被吞掉
fn launch_later(path: String) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(600));
        launch_installer(&path);
    });
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

// 由 Rust 侧直接下载（经代理，规避 JS 层大文件序列化问题），保存并启动安装程序
#[tauri::command]
async fn save_and_launch(app: tauri::AppHandle, url: String, file_name: String) -> Result<serde_json::Value, String> {
    let bytes = download_bytes(&url).await?;
    match pick_save_path(&app, &file_name) {
        Some(path) => {
            fs::write(&path, &bytes).map_err(|e| e.to_string())?;
            launch_later(path.to_string_lossy().to_string());
            Ok(serde_json::json!({ "success": true }))
        }
        None => Ok(serde_json::json!({ "cancelled": true })),
    }
}

// 兜底：JS 层已校验的字节直接交给 Rust 保存并启动（适用于小文件）
#[tauri::command]
async fn save_and_launch_from_bytes(app: tauri::AppHandle, bytes: Vec<u8>, file_name: String) -> Result<serde_json::Value, String> {
    match pick_save_path(&app, &file_name) {
        Some(path) => {
            fs::write(&path, &bytes).map_err(|e| e.to_string())?;
            launch_later(path.to_string_lossy().to_string());
            Ok(serde_json::json!({ "success": true }))
        }
        None => Ok(serde_json::json!({ "cancelled": true })),
    }
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
            save_and_launch,
            save_and_launch_from_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
