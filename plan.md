# Markdown Editor — Tauri 2 Desktop App

Create a cross-platform desktop application using **Tauri 2** — a modern, distraction-free Markdown editor with a simple and elegant UI.

---

## Core Features

### Editor & Preview

- **Split-screen layout**: A side-by-side view with a text editor on the left and a rendered preview on the right (CSS Grid / Flexbox).
- **Synchronized scrolling**: Scroll-Ratio-Mechanismus — beim Scrollen im Editor wird die Vorschau proportional an die gleiche Position gescrollt. Berücksichtigt unterschiedliche Inhaltshöhen und nachgeladene Elemente (z. B. Bilder).
- **Live Rendering**: Die Vorschau aktualisiert sich in Echtzeit während der Eingabe (via `marked.js` + Vue-Reaktivität).

### Layout Modes

- **Split View** (Default): Side-by-side.
- **Preview Only**: Blendet den Editor aus — reiner Lesemodus.
- **Focus Mode**: Blendet die Vorschau aus — maximale Schreibkonzentration.

Umsetzung über Pinia-State (z. B. `layoutMode: 'split' | 'preview' | 'focus'`) + dynamische CSS-Klassen.

### Native File System Integration

- **Open File**: Über Tauri's `@tauri-apps/plugin-dialog` → Dateiauswahl für `.md`-Dateien.
- **Save / Save As**: Speichern via `@tauri-apps/plugin-fs`.
- **Title Bar**: Aktueller Dateiname im Fenstertitel via `@tauri-apps/api/window.setTitle()`. Ein `*` signalisiert ungespeicherte Änderungen.
- **⚠️ Tauri 2 Capabilities**: Für Dateizugriff und Dialoge müssen Capabilities in `src-tauri/capabilities/` konfiguriert werden (mind. `dialog:default`, `fs:read`, `fs:write`, `window:default`).

### Toolbar

Eine minimale Toolbar mit Formatierungs-Buttons:

- **B** (Bold: `**text**` einfügen/umschließen)
- **I** (Italic: `*text*` einfügen/umschließen)
- **H** (Heading: `# ` vor die Zeile setzen)
- **List** (Liste: `- ` vor jede Zeile)
- **Link** (Link: `[text](url)` einfügen)

> **Hinweis**: Die Buttons manipulieren den Text direkt im Editor (Cursor-Position ermitteln, Markdown-Syntax um die Selection legen). Dies ist etwas aufwändiger als ein einfacher Toggle.

### Tastaturkürzel

| Kürzel         | Aktion         |
| -------------- | -------------- |
| `Cmd/Ctrl + S` | Speichern      |
| `Cmd/Ctrl + O` | Öffnen         |
| `Cmd/Ctrl + N` | Neues Dokument |
| `Cmd/Ctrl + B` | Bold           |
| `Cmd/Ctrl + I` | Italic         |

### Auto-Save (Optional)

- Automatisches Speichern nach einer Verzögerung (z. B. 2 Sekunden nach der letzten Eingabe).
- **Recovery**: Ungespeicherte Änderungen im `localStorage` sichern, um sie nach einem Absturz wiederherzustellen.

---

## Design Requirements

- **Premium Desktop Look**: Native macOS-Anmutung mit dezentem Glassmorphismus oder cleaner Sidebar. _Hinweis: Glassmorphism (Transparenz/Blur) kann auf älterer Hardware performance-intensiv sein — gegebenenfalls optional schaltbar._
- **Color Themes**: Light & Dark Mode — synct standardmäßig mit dem OS-Theme (`prefers-color-scheme`), über ein Menü umschaltbar.
- **Customizable Typography**: 3–5 kuratierte Fonts zur Auswahl (z. B. Inter, JetBrains Mono, Source Serif). Umsetzung via CSS-Variablen.

---

## Technical Constraints

- **Framework**: Tauri 2 (Latest stable)
- **Frontend**: Vite + **Vue.js 3** (Composition API, `<template>` zuerst in SFCs)
- **State Management**: Pinia
- **Styling**: Vanilla CSS
- **Abhängigkeiten**:

| Paket                       | Zweck                                           |
| --------------------------- | ----------------------------------------------- |
| `marked`                    | Markdown → HTML Parsing                         |
| `marked-highlight`          | Brücke zwischen marked und Prism.js             |
| `prismjs`                   | Code-Syntax-Highlighting (CSS-Theme einbindbar) |
| `@tauri-apps/api`           | Tauri-Brücke (Fenster, Events)                  |
| `@tauri-apps/plugin-dialog` | Native Datei-Dialoge                            |
| `@tauri-apps/plugin-fs`     | Dateisystem-Zugriff                             |
| `@tauri-apps/plugin-theme`  | (Optional) OS-Theme-Erkennung                   |

- **Packaging**: `tauri build` erzeugt native Pakete für macOS (.dmg), Windows (.msi) und Linux (.deb/.AppImage)

---

## Tauri 2 Capabilities (Konfiguration)

In `src-tauri/capabilities/default.json` müssen folgende Berechtigungen gesetzt werden:

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:default",
    "fs:allow-read",
    "fs:allow-write",
    "window:default",
    "window:allow-set-title"
  ]
}
```

---

## Projektstruktur

```
md-editor/
├── src/                        # Vue.js Frontend
│   ├── App.vue
│   ├── main.js
│   ├── components/
│   │   ├── EditorPane.vue      # Linke Seite: Textarea/Editor
│   │   ├── PreviewPane.vue     # Rechte Seite: gerendertes HTML
│   │   └── Toolbar.vue         # Formatierungs-Buttons
│   ├── stores/
│   │   ├── editor.js           # Pinia-Store: Inhalt, Dateipfad, dirty-flag
│   │   └── settings.js         # Theme, Font, Layout-Mode
│   ├── styles/
│   │   ├── variables.css       # CSS-Variablen (Farben, Fonts)
│   │   ├── themes.css          # Light / Dark
│   │   ├── editor.css          # Editor-Styling
│   │   └── preview.css         # Preview + Prism.js-Override
│   └── utils/
│       └── markdown.js         # marked-Konfiguration + Prism-Integration
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json        # Capability-Berechtigungen
│   ├── src/
│   │   └── lib.rs              # Tauri-Backend (minimal, falls nötig)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

---

## UI-Zustände (Pinia Store Übersicht)

### `stores/editor.js`

| State       | Typ              | Beschreibung                    |
| ----------- | ---------------- | ------------------------------- |
| `content`   | `string`         | Aktueller Markdown-Inhalt       |
| `filePath`  | `string \| null` | Pfad der geöffneten Datei       |
| `isDirty`   | `boolean`        | Ungespeicherte Änderungen?      |
| `undoStack` | `string[]`       | (Nice-to-have) Verlauf für Undo |

### `stores/settings.js`

| State        | Typ                               | Beschreibung         |
| ------------ | --------------------------------- | -------------------- |
| `theme`      | `'system' \| 'light' \| 'dark'`   | Aktuelles Farbschema |
| `layoutMode` | `'split' \| 'preview' \| 'focus'` | Ansichtsmodus        |
| `fontFamily` | `string`                          | Gewählte Schriftart  |

---

## Realisierungs-Reihenfolge (Vorschlag)

1. **Tauri 2 + Vue 3 + Vite Projekt aufsetzen** (`npm create tauri-app`)
2. **Pinia Stores + Basis-Layout** (Split-Screen, Layout-Modes)
3. **Markdown-Parsing** (marked + marked-highlight + Prism.js)
4. **Live Rendering** (Reactivity zwischen Editor und Preview)
5. **Synchronized Scrolling** (Scroll-Ratio berechnen)
6. **Toolbar + Text-Manipulation** (Cursor-basierte Markdown-Formatierung)
7. **Native File-Operationen** (Dialoge, FS, Capabilities, Title-Bar)
8. **Keyboard Shortcuts**
9. **Theming (Light/Dark/Fonts)**
10. **Auto-Save + Recovery** (optional)
11. **Feinschliff + Packaging**
