use tauri::menu::{MenuBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // ─── File Submenu ───
            let new_item = tauri::menu::MenuItemBuilder::with_id("file_new", "Neu")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let open_item = tauri::menu::MenuItemBuilder::with_id("file_open", "Öffnen…")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;

            let save_item = tauri::menu::MenuItemBuilder::with_id("file_save", "Speichern")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;

            let save_as_item =
                tauri::menu::MenuItemBuilder::with_id("file_save_as", "Speichern unter…")
                    .accelerator("CmdOrCtrl+Shift+S")
                    .build(app)?;

            let file_submenu = SubmenuBuilder::new(app, "Datei")
                .item(&new_item)
                .item(&open_item)
                .item(&save_item)
                .item(&save_as_item)
                .separator()
                .item(&PredefinedMenuItem::quit(app, Some("Beenden"))?)
                .build()?;

            // ─── Edit Submenu ───
            let undo_item = tauri::menu::MenuItemBuilder::with_id("edit_undo", "Rückgängig")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?;

            let edit_submenu = SubmenuBuilder::new(app, "Bearbeiten")
                .item(&undo_item)
                .item(&PredefinedMenuItem::cut(app, Some("Ausschneiden"))?)
                .item(&PredefinedMenuItem::copy(app, Some("Kopieren"))?)
                .item(&PredefinedMenuItem::paste(app, Some("Einfügen"))?)
                .item(&PredefinedMenuItem::select_all(app, Some("Alles auswählen"))?)
                .build()?;

            // ─── View Submenu ───
            let split_view = tauri::menu::MenuItemBuilder::with_id("view_split", "Split-Ansicht")
                .accelerator("CmdOrCtrl+1")
                .build(app)?;

            let preview_only =
                tauri::menu::MenuItemBuilder::with_id("view_preview", "Nur Vorschau")
                    .accelerator("CmdOrCtrl+2")
                    .build(app)?;

            let focus_mode = tauri::menu::MenuItemBuilder::with_id("view_focus", "Fokus-Modus")
                .accelerator("CmdOrCtrl+3")
                .build(app)?;

            let toggle_theme =
                tauri::menu::MenuItemBuilder::with_id("view_toggle_theme", "Theme umschalten")
                    .accelerator("CmdOrCtrl+T")
                    .build(app)?;

            let view_submenu = SubmenuBuilder::new(app, "Ansicht")
                .item(&split_view)
                .item(&preview_only)
                .item(&focus_mode)
                .separator()
                .item(&toggle_theme)
                .build()?;

            // ─── Window Submenu ───
            let minimize = PredefinedMenuItem::minimize(app, Some("Miniaturisieren"))?;
            let close_window = PredefinedMenuItem::close_window(app, Some("Schließen"))?;
            let window_submenu = SubmenuBuilder::new(app, "Fenster")
                .item(&minimize)
                .item(&close_window)
                .build()?;

            // ─── Main Menu ───
            let menu = MenuBuilder::new(app)
                .item(&file_submenu)
                .item(&edit_submenu)
                .item(&view_submenu)
                .item(&window_submenu)
                .build()?;

            app.set_menu(menu)?;

            // ─── Menu Event Handler ───
            app.on_menu_event(move |app, event| {
                let window = match app.get_webview_window("main") {
                    Some(w) => w,
                    None => return,
                };
                match event.id().as_ref() {
                    "file_new" => {
                        let _ = window.emit("menu-file-new", ());
                    }
                    "file_open" => {
                        let _ = window.emit("menu-file-open", ());
                    }
                    "file_save" => {
                        let _ = window.emit("menu-file-save", ());
                    }
                    "file_save_as" => {
                        let _ = window.emit("menu-file-save-as", ());
                    }
                    "edit_undo" => {
                        let _ = window.emit("menu-edit-undo", ());
                    }
                    "view_split" => {
                        let _ = window.emit("menu-view-split", ());
                    }
                    "view_preview" => {
                        let _ = window.emit("menu-view-preview", ());
                    }
                    "view_focus" => {
                        let _ = window.emit("menu-view-focus", ());
                    }
                    "view_toggle_theme" => {
                        let _ = window.emit("menu-view-toggle-theme", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
