<template>
  <div class="app-container" :class="layoutClass">
    <Toolbar />
    <div class="main-content">
      <EditorPane
        ref="editorRef"
        v-show="showEditor"
        @scroll="onEditorScroll"
      />
      <div v-if="showResizer" class="resizer" @mousedown="startResize"></div>
      <PreviewPane
        ref="previewRef"
        v-show="showPreview"
        @scroll="onPreviewScroll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSettingsStore } from "./stores/settings";
import { useEditorStore } from "./stores/editor";
import Toolbar from "./components/Toolbar.vue";
import EditorPane from "./components/EditorPane.vue";
import PreviewPane from "./components/PreviewPane.vue";
import { getCurrentWindow } from "@tauri-apps/api/window";

const settingsStore = useSettingsStore();
const editorStore = useEditorStore();

const editorRef = ref<InstanceType<typeof EditorPane> | null>(null);
const previewRef = ref<InstanceType<typeof PreviewPane> | null>(null);

let syncingEditor = false;
let syncingPreview = false;

// ─── Layout ───

const showEditor = computed(() => {
  return (
    settingsStore.layoutMode === "split" || settingsStore.layoutMode === "focus"
  );
});

const showPreview = computed(() => {
  return (
    settingsStore.layoutMode === "split" ||
    settingsStore.layoutMode === "preview"
  );
});

const showResizer = computed(() => {
  return settingsStore.layoutMode === "split";
});

const layoutClass = computed(() => {
  return `layout-${settingsStore.layoutMode}`;
});

// ─── Synchronized Scrolling ───

function onEditorScroll(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
) {
  if (syncingEditor) return;
  syncingPreview = true;

  const previewEl = previewRef.value;
  if (!previewEl) return;
  const pInfo = previewEl.getScrollInfo();

  const editorRatio =
    scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
  const previewMaxScroll = pInfo.scrollHeight - pInfo.clientHeight;
  previewEl.setScrollTop(
    previewMaxScroll > 0 ? editorRatio * previewMaxScroll : 0,
  );

  requestAnimationFrame(() => {
    syncingPreview = false;
  });
}

function onPreviewScroll(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
) {
  if (syncingPreview) return;
  syncingEditor = true;

  const editorEl = editorRef.value;
  if (!editorEl) return;
  const eInfo = editorEl.getScrollInfo();

  const previewRatio =
    scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
  const editorMaxScroll = eInfo.scrollHeight - eInfo.clientHeight;
  editorEl.setScrollTop(
    editorMaxScroll > 0 ? previewRatio * editorMaxScroll : 0,
  );

  requestAnimationFrame(() => {
    syncingEditor = false;
  });
}

// ─── Resizer (Split-View) ───

let isResizing = false;

function startResize(_e: MouseEvent) {
  isResizing = true;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onResize(e: MouseEvent) {
  if (!isResizing) return;
  const container = document.querySelector(".main-content") as HTMLElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  const clamped = Math.max(0.2, Math.min(0.8, ratio));
  container.style.setProperty("--split-ratio", `${clamped * 100}%`);
}

function stopResize() {
  isResizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

// ─── File Operations (Tauri) ───
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

async function openFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    });
    if (selected) {
      const content = await readTextFile(selected);
      editorStore.setContent(content);
      editorStore.filePath = selected;
      editorStore.markSaved();
      updateTitle();
    }
  } catch (e) {
    console.error("Fehler beim Öffnen:", e);
  }
}

async function saveFile() {
  if (editorStore.filePath) {
    try {
      await writeTextFile(editorStore.filePath, editorStore.content);
      editorStore.markSaved();
      updateTitle();
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    }
  } else {
    await saveFileAs();
  }
}

async function saveFileAs() {
  try {
    const selected = await save({
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
      defaultPath: editorStore.fileName.endsWith(".md")
        ? editorStore.fileName
        : `${editorStore.fileName}.md`,
    });
    if (selected) {
      await writeTextFile(selected, editorStore.content);
      editorStore.filePath = selected;
      editorStore.markSaved();
      updateTitle();
    }
  } catch (e) {
    console.error("Fehler beim Speichern unter:", e);
  }
}

function newFile() {
  editorStore.reset();
  updateTitle();
}

function updateTitle() {
  const win = getCurrentWindow();
  const title = editorStore.isDirty
    ? `${editorStore.fileName}*`
    : editorStore.fileName;
  win.setTitle(title);
}

// ─── Keyboard Shortcuts ───

function handleKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey;

  if (mod && e.key === "o") {
    e.preventDefault();
    openFile();
  } else if (mod && e.key === "s") {
    e.preventDefault();
    saveFile();
  } else if (mod && e.key === "n") {
    e.preventDefault();
    newFile();
  }
}

// ─── Lifecycle ───

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  updateTitle();

  // Watch dirty state for title updates
  editorStore.$subscribe(() => {
    updateTitle();
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style>
/* ─── Global Styles ─── */
@import "./styles/variables.css";

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-ui);
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─── App Layout ─── */

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  --split-ratio: 50%;
}

/* Split View */
.layout-split .main-content > :first-child {
  width: var(--split-ratio);
  min-width: 200px;
}

.layout-split .main-content > :last-child {
  flex: 1;
  min-width: 200px;
}

/* Preview Only */
.layout-preview .editor-pane {
  display: none;
}

.layout-preview .preview-pane {
  width: 100%;
}

/* Focus Mode */
.layout-focus .preview-pane {
  display: none;
}

.layout-focus .editor-pane {
  width: 100%;
}

/* ─── Resizer ─── */

.resizer {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  transition: background 0.15s;
}

.resizer:hover,
.resizer:active {
  background: var(--accent);
}
</style>
