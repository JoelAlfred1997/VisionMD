use std::fs;
use std::path::Path;

/// Hard ceiling so a pathological file can't exhaust memory. ~25 MB of text
/// is far larger than any realistic Markdown document.
const MAX_FILE_BYTES: u64 = 25 * 1024 * 1024;

const SUPPORTED_EXTENSIONS: [&str; 4] = ["md", "markdown", "mdown", "mkd"];

/// True if `path` ends in a supported Markdown extension.
fn is_supported(path: &str) -> bool {
    Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| SUPPORTED_EXTENSIONS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

/// The first CLI argument that looks like a Markdown file, if any.
///
/// When VisionMD is the default `.md` handler (or launched via "Open with"),
/// the OS passes the file path as a command-line argument. We pick the first
/// supported one and ignore flags/other args.
fn markdown_arg(args: &[String]) -> Option<String> {
    args.iter().skip(1).find(|a| is_supported(a)).cloned()
}

/// Path the app was launched with (file association / "Open with" / CLI).
/// Returns `null` to the frontend when the app was opened normally.
#[tauri::command]
fn get_launch_file() -> Option<String> {
    markdown_arg(&std::env::args().collect::<Vec<_>>())
}

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

/// Write Markdown text back to disk (used by the editor's Save / Save As).
///
/// Validates the extension and size before writing so the editor can only ever
/// overwrite Markdown files, never arbitrary paths. The path comes from a file
/// the user opened or explicitly chose in the Save dialog.
#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    if !is_supported(&path) {
        return Err("Can only save Markdown files (.md, .markdown, .mdown, .mkd).".into());
    }

    if content.len() as u64 > MAX_FILE_BYTES {
        return Err("Document is too large to save (over 25 MB).".into());
    }

    fs::write(Path::new(&path), content).map_err(|e| format!("Cannot save file: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Single-instance must be registered first. A second launch (e.g. the user
    // double-clicks another .md while VisionMD is open) is forwarded here
    // instead of opening a new window: focus the existing window and tell the
    // UI to open the new file via the "open-file" event.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        use tauri::{Emitter, Manager};
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
        }
        if let Some(file) = markdown_arg(&argv) {
            let _ = app.emit("open-file", file);
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            get_launch_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
