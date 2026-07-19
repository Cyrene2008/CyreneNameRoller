use tauri::{LogicalSize, Manager};
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
fn load_changelog(app: tauri::AppHandle) -> serde_json::Value {
    let resource_dir = get_resource_dir(&app);
    let paths = [
        resource_dir.join("updatelogs").join("up.json"),
        PathBuf::from("public/updatelogs/up.json"),
        PathBuf::from("dist/updatelogs/up.json"),
    ];
    for p in &paths {
        if let Ok(s) = fs::read_to_string(p) {
            if let Ok(v) = serde_json::from_str(&s) {
                return v;
            }
        }
    }
    serde_json::json!([])
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

#[tauri::command]
async fn save_and_launch(app: tauri::AppHandle, url: String, file_name: String) -> Result<serde_json::Value, String> {
    use tauri_plugin_dialog::DialogExt;

    // 先下载到临时文件
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url)
        .header("User-Agent", "CyreneNameRoller")
        .send()
        .await
        .map_err(|e| format!("下载失败: {}", e))?;

    let bytes = resp.bytes().await.map_err(|e| format!("读取失败: {}", e))?;

    // 弹出保存对话框
    let file_path = app.dialog()
        .file()
        .set_title("保存安装程序")
        .set_file_name(&file_name)
        .add_filter("安装程序", &["exe"])
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let path_buf = path.as_path().unwrap_or(std::path::Path::new(""));
            fs::write(path_buf, &bytes).map_err(|e| e.to_string())?;
            #[cfg(target_os = "windows")]
            { let _ = Command::new("cmd").args(["/C", "start", "", path_buf.to_str().unwrap_or("")]).spawn(); }
            #[cfg(target_os = "macos")]
            { let _ = Command::new("open").arg(path_buf.to_str().unwrap_or("")).spawn(); }
            #[cfg(target_os = "linux")]
            { let _ = Command::new("xdg-open").arg(path_buf.to_str().unwrap_or("")).spawn(); }
            Ok(serde_json::json!({ "success": true }))
        }
        None => Ok(serde_json::json!({ "cancelled": true }))
    }
}

#[tauri::command]
async fn open_floating_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("floating") {
        win.set_size(LogicalSize::new(64.0, 64.0)).map_err(|e| e.to_string())?;
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    tauri::WebviewWindowBuilder::new(&app, "floating", tauri::WebviewUrl::App("index.html#/floating".into()))
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
async fn minimize_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.minimize().map_err(|e| e.to_string())?;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 创建托盘菜单
            let show = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // 创建托盘图标
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Cyreneの随机点名器")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

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
            save_and_launch,
            open_floating_window,
            close_floating_window,
            focus_main_window,
            minimize_main_window,
            hide_to_tray
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
