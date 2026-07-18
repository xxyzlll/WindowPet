use log::{info, error};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageRecord {
    pub original_path: String,
    pub stored_path: String,
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageHistory {
    pub records: Vec<StorageRecord>,
    pub timestamp: i64,
    pub storage_folder: String,
}

#[derive(Debug, Serialize)]
pub struct StorageResult {
    pub success: i32,
    pub skipped: i32,
    pub failed: i32,
    pub total: i32,
    pub storage_folder: String,
}

#[derive(Debug, Serialize)]
pub struct PendingFilesResult {
    pub total: i32,
    pub files: Vec<String>,
    pub storage_folder: String,
}

fn get_desktop_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Failed to get home directory")?;
    Ok(home.join("Desktop"))
}

fn get_storage_folder_path() -> Result<(PathBuf, String), String> {
    let desktop = get_desktop_path()?;
    let folder_name = "临时收纳盒".to_string();
    let storage_path = desktop.join(&folder_name);
    Ok((storage_path, folder_name))
}

fn get_history_path() -> Result<PathBuf, String> {
    let app_root = crate::app::conf::app_root();
    Ok(app_root.join("storage_history.json"))
}

fn save_history(history: &StorageHistory) -> Result<(), String> {
    let path = get_history_path()?;
    let json = serde_json::to_string_pretty(history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write history: {}", e))?;
    Ok(())
}

fn load_history() -> Option<StorageHistory> {
    let path = get_history_path().ok()?;
    if !path.exists() {
        return None;
    }
    let content = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&content).ok()
}

fn is_hidden_file(path: &Path) -> bool {
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        return name.starts_with('.');
    }
    false
}

fn is_system_icon(path: &Path) -> bool {
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        let name_lower = name.to_lowercase();
        return name_lower == ".ds_store"
            || name_lower == "thumbs.db"
            || name_lower == "desktop.ini"
            || name_lower == "icon\r";
    }
    false
}

fn get_unique_path(dest_dir: &Path, file_name: &str) -> PathBuf {
    let path = dest_dir.join(file_name);
    if !path.exists() {
        return path;
    }

    let stem = Path::new(file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
    let extension = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let mut counter = 1;
    loop {
        let new_name = if extension.is_empty() {
            format!("{}_{}", stem, counter)
        } else {
            format!("{}_{}.{}", stem, counter, extension)
        };
        let new_path = dest_dir.join(new_name);
        if !new_path.exists() {
            return new_path;
        }
        counter += 1;
    }
}

fn collect_desktop_files(storage_folder_name: &str) -> Result<Vec<PathBuf>, String> {
    let desktop = get_desktop_path()?;
    let mut files = Vec::new();

    let entries = fs::read_dir(&desktop).map_err(|e| format!("Failed to read desktop: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy().to_string();

        if file_name_str == storage_folder_name {
            continue;
        }

        if is_hidden_file(&path) || is_system_icon(&path) {
            continue;
        }

        files.push(path);
    }

    Ok(files)
}

fn move_single_file(src: &Path, dest_dir: &Path) -> Result<(PathBuf, PathBuf), String> {
    if !src.exists() {
        return Err("Source file does not exist".to_string());
    }

    let file_name = src
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid file name")?
        .to_string();

    let dest_path = get_unique_path(dest_dir, &file_name);

    fs::create_dir_all(dest_dir).map_err(|e| format!("Failed to create storage folder: {}", e))?;

    fs::rename(src, &dest_path).or_else(|_| {
        fs::copy(src, &dest_path).and_then(|_| fs::remove_file(src))
            .map_err(|e| format!("Failed to move file: {}", e))
    })?;

    Ok((src.to_path_buf(), dest_path))
}

#[tauri::command]
pub async fn quick_tidy_desktop() -> Result<StorageResult, String> {
    info!("Quick tidy desktop started");

    let (storage_path, folder_name) = get_storage_folder_path()?;
    fs::create_dir_all(&storage_path).map_err(|e| format!("Failed to create storage folder: {}", e))?;

    let files = collect_desktop_files(&folder_name)?;

    let mut result = StorageResult {
        success: 0,
        skipped: 0,
        failed: 0,
        total: files.len() as i32,
        storage_folder: storage_path.to_string_lossy().to_string(),
    };

    let mut records = Vec::new();

    for file_path in &files {
        match move_single_file(file_path, &storage_path) {
            Ok((original, stored)) => {
                result.success += 1;
                records.push(StorageRecord {
                    original_path: original.to_string_lossy().to_string(),
                    stored_path: stored.to_string_lossy().to_string(),
                    file_name: stored
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string(),
                });
            }
            Err(e) => {
                error!("Failed to move file {:?}: {}", file_path, e);
                result.failed += 1;
            }
        }
    }

    let history = StorageHistory {
        records,
        timestamp: chrono::Local::now().timestamp(),
        storage_folder: storage_path.to_string_lossy().to_string(),
    };
    let _ = save_history(&history);

    info!("Quick tidy completed: {} success, {} failed", result.success, result.failed);
    Ok(result)
}

#[tauri::command]
pub async fn get_pending_tidy_files() -> Result<PendingFilesResult, String> {
    info!("Getting pending tidy files");

    let (storage_path, folder_name) = get_storage_folder_path()?;
    let files = collect_desktop_files(&folder_name)?;

    let file_paths: Vec<String> = files
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    Ok(PendingFilesResult {
        total: file_paths.len() as i32,
        files: file_paths,
        storage_folder: storage_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub async fn move_single_file_to_storage(file_path: String) -> Result<StorageRecord, String> {
    info!("Moving single file to storage: {}", file_path);

    let (storage_path, _) = get_storage_folder_path()?;
    let src = PathBuf::from(&file_path);

    let (original, stored) = move_single_file(&src, &storage_path)?;

    let record = StorageRecord {
        original_path: original.to_string_lossy().to_string(),
        stored_path: stored.to_string_lossy().to_string(),
        file_name: stored
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string(),
    };

    Ok(record)
}

#[tauri::command]
pub async fn save_storage_history(records: Vec<StorageRecord>) -> Result<(), String> {
    let (storage_path, _) = get_storage_folder_path()?;
    let history = StorageHistory {
        records,
        timestamp: chrono::Local::now().timestamp(),
        storage_folder: storage_path.to_string_lossy().to_string(),
    };
    save_history(&history)
}

#[tauri::command]
pub async fn undo_last_storage() -> Result<StorageResult, String> {
    info!("Undo last storage");

    let history = load_history().ok_or_else(|| "No storage history found".to_string())?;

    let mut result = StorageResult {
        success: 0,
        skipped: 0,
        failed: 0,
        total: history.records.len() as i32,
        storage_folder: history.storage_folder.clone(),
    };

    for record in &history.records {
        let stored_path = PathBuf::from(&record.stored_path);
        let original_path = PathBuf::from(&record.original_path);

        if !stored_path.exists() {
            result.skipped += 1;
            continue;
        }

        if let Some(parent) = original_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let dest_path = if original_path.exists() {
            get_unique_path(original_path.parent().unwrap_or(Path::new("/")), &record.file_name)
        } else {
            original_path.clone()
        };

        match fs::rename(&stored_path, &dest_path).or_else(|_| {
            fs::copy(&stored_path, &dest_path).and_then(|_| fs::remove_file(&stored_path))
        }) {
            Ok(_) => {
                result.success += 1;
            }
            Err(e) => {
                error!("Failed to restore file {:?}: {}", stored_path, e);
                result.failed += 1;
            }
        }
    }

    info!("Undo completed: {} success, {} failed", result.success, result.failed);
    Ok(result)
}

#[tauri::command]
pub async fn has_storage_history() -> bool {
    load_history().is_some()
}
