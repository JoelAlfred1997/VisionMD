use std::fs;
use std::path::Path;

/// Hard ceiling so a pathological file can't exhaust memory. ~25 MB of text
/// is far larger than any realistic Markdown document.
const MAX_FILE_BYTES: u64 = 25 * 1024 * 1024;

const SUPPORTED_EXTENSIONS: [&str; 4] = ["md", "markdown", "mdown", "mkd"];

/// Read a user-selected Markdown file from disk and return its raw contents.
///
/// This is the only filesystem entry point exposed to the frontend. It is
/// invoked exclusively with paths the user picked via the native dialog or
/// drag-and-drop, validates the extension and size, and never logs contents.
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    let p = Path::new(&path);

    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default();

    if !SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!("Unsupported file type: .{ext}"));
    }

    let meta = fs::metadata(p).map_err(|e| format!("Cannot open file: {e}"))?;
    if meta.len() > MAX_FILE_BYTES {
        return Err("File is too large to open (over 25 MB).".into());
    }

    fs::read_to_string(p).map_err(|e| format!("Cannot read file: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_text_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
