// Lumen desktop entry — Phase 15.
//
// Wires:
//   - global hotkey (⌥Space) → quick capture window
//   - system tray (Open / Quick Capture / Today's Daily / Quit)
//   - menu-bar mode (macOS)
//   - native notifications
//   - deep links (lumen://node/<id>)
//   - auto-updater (Ed25519 signed)
//   - local SQLite for offline-first sync (Phase 15.x)

use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build());

    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed && shortcut.matches(Modifiers::ALT, Code::Space)
                    {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("lumen:quick-capture", ());
                        }
                    }
                })
                .build(),
        );
    }

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                let opt_space = Shortcut::new(Some(Modifiers::ALT), Code::Space);
                app.global_shortcut().register(opt_space)?;
                commands::tray::init_tray(app.handle())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::quick_capture::submit_capture,
            commands::sync::push_changes,
            commands::sync::pull_changes,
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // On macOS, hide instead of quitting so the app stays in
                // the menu bar.
                #[cfg(target_os = "macos")]
                {
                    api.prevent_close();
                    let _ = window.hide();
                }
                #[cfg(not(target_os = "macos"))]
                {
                    let _ = (window, api);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Lumen desktop");
}
