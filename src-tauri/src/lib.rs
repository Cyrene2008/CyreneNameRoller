use tauri::Manager;
use std::fs;
use std::path::PathBuf;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            storage_get,
            storage_set,
            storage_delete,
            storage_clear,
            load_names,
            load_changelog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
