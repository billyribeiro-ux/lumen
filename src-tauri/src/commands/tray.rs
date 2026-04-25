use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn init_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Lumen", true, None::<&str>)?;
    let quick_capture = MenuItem::with_id(app, "quick_capture", "Quick capture (⌥Space)", true, None::<&str>)?;
    let today = MenuItem::with_id(app, "today", "Today's Daily (⌘D)", true, None::<&str>)?;
    let separator = MenuItem::with_id(app, "_sep", "—", false, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, Some("Cmd+,"))?;
    let quit = MenuItem::with_id(app, "quit", "Quit Lumen", true, Some("Cmd+Q"))?;

    let menu = Menu::with_items(
        app,
        &[&open, &quick_capture, &today, &separator, &settings, &quit],
    )?;

    let icon = Image::from_bytes(include_bytes!("../../icons/tray.png")).unwrap_or_else(|_| {
        // Empty fallback so dev builds work before the icon is dropped in.
        Image::new_owned(vec![0; 4], 1, 1)
    });

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Lumen")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "quick_capture" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("lumen:quick-capture", ());
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "today" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("lumen:goto", "/today");
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "settings" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("lumen:goto", "/settings");
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                if let Some(w) = tray.app_handle().get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
