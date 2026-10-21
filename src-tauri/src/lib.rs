// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// Lines a pet can say when you give it some attention.
const PET_LINES: [&str; 6] = [
    "is purring loudly",
    "rolls over for a belly rub",
    "blinks slowly at you",
    "nuzzles your hand",
    "yawns and settles down",
    "tilts its head at you",
];

/// Pick a line for the pet to say back to you.
///
/// This lives in Rust on purpose: it is the smallest possible example of the
/// frontend calling into the backend. The frontend calls this with
/// `invoke("pet_says", { name })`.
#[tauri::command]
fn pet_says(name: &str) -> String {
    // Use the current nanosecond to pick a line. Good enough for a pet, and
    // it avoids pulling in an extra dependency just for randomness.
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.subsec_nanos() as usize)
        .unwrap_or(0);

    format!("{name} {}", PET_LINES[nanos % PET_LINES.len()])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![pet_says])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
