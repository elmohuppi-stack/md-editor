<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="toolbar-title">{{ editorStore.fileName }}</span>
      <span
        v-if="editorStore.isDirty"
        class="dirty-indicator"
        title="Ungespeicherte Änderungen"
        >*</span
      >
    </div>

    <div class="toolbar-center">
      <button class="tool-btn" title="Fett (Cmd+B)" @click="formatBold">
        <strong>B</strong>
      </button>
      <button class="tool-btn" title="Kursiv (Cmd+I)" @click="formatItalic">
        <em>I</em>
      </button>
      <span class="toolbar-divider"></span>
      <button class="tool-btn" title="Überschrift" @click="formatHeading">
        H
      </button>
      <button class="tool-btn" title="Liste" @click="formatList">≡</button>
      <button class="tool-btn" title="Link" @click="formatLink">🔗</button>
      <span class="toolbar-divider"></span>
      <button class="tool-btn" title="Rückgängig (Cmd+Z)" @click="undo">
        ↩
      </button>
    </div>

    <div class="toolbar-right">
      <button
        class="tool-btn layout-btn"
        :class="{ active: settingsStore.layoutMode === 'split' }"
        title="Split View"
        @click="settingsStore.setLayoutMode('split')"
      >
        ⊞
      </button>
      <button
        class="tool-btn layout-btn"
        :class="{ active: settingsStore.layoutMode === 'preview' }"
        title="Preview Only"
        @click="settingsStore.setLayoutMode('preview')"
      >
        👁
      </button>
      <button
        class="tool-btn layout-btn"
        :class="{ active: settingsStore.layoutMode === 'focus' }"
        title="Focus Mode"
        @click="settingsStore.setLayoutMode('focus')"
      >
        ✎
      </button>
      <span class="toolbar-divider"></span>
      <button class="tool-btn" title="Theme umschalten" @click="toggleTheme">
        <span v-if="isDark">☀️</span>
        <span v-else>🌙</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "../stores/editor";
import { useSettingsStore } from "../stores/settings";

const editorStore = useEditorStore();
const settingsStore = useSettingsStore();

const isDark = computed(() => {
  if (settingsStore.theme === "dark") return true;
  if (settingsStore.theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
});

function toggleTheme() {
  if (settingsStore.theme === "light") settingsStore.setTheme("dark");
  else if (settingsStore.theme === "dark") settingsStore.setTheme("system");
  else settingsStore.setTheme("light");
}

function insertAround(before: string, after: string) {
  const activeEl = document.activeElement as HTMLTextAreaElement | null;
  if (!activeEl || activeEl.tagName !== "TEXTAREA") return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const text = activeEl.value;
  const selected = text.substring(start, end);

  const newText =
    text.substring(0, start) + before + selected + after + text.substring(end);
  editorStore.setContent(newText);

  // Restore selection
  requestAnimationFrame(() => {
    activeEl.focus();
    if (selected) {
      activeEl.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    } else {
      activeEl.setSelectionRange(start + before.length, start + before.length);
    }
  });
}

function insertBefore(before: string) {
  const activeEl = document.activeElement as HTMLTextAreaElement | null;
  if (!activeEl || activeEl.tagName !== "TEXTAREA") return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const text = activeEl.value;
  const selected = text.substring(start, end);

  // Check if we're at the beginning of a line
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const linePrefix = text.substring(lineStart, start);

  // If the selection spans multiple lines, prepend to each line
  if (selected.includes("\n")) {
    const lines = selected.split("\n");
    const newLines = lines.map((line) => before + line);
    const newText =
      text.substring(0, lineStart) + newLines.join("\n") + text.substring(end);
    editorStore.setContent(newText);
  } else {
    const newText =
      text.substring(0, lineStart) +
      before +
      linePrefix +
      selected +
      text.substring(end);
    editorStore.setContent(newText);
    requestAnimationFrame(() => {
      activeEl.focus();
      activeEl.setSelectionRange(end + before.length, end + before.length);
    });
  }
}

function formatBold() {
  insertAround("**", "**");
}

function formatItalic() {
  insertAround("*", "*");
}

function formatHeading() {
  insertBefore("# ");
}

function formatList() {
  insertBefore("- ");
}

function formatLink() {
  const activeEl = document.activeElement as HTMLTextAreaElement | null;
  if (!activeEl || activeEl.tagName !== "TEXTAREA") return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const text = activeEl.value;
  const selected = text.substring(start, end);

  if (selected) {
    insertAround("[", "](url)");
  } else {
    insertAround("[Linktext](", ")");
  }
}

function undo() {
  editorStore.undo();
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--toolbar-height);
  padding: 0 12px;
  background: var(--bg-toolbar);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  user-select: none;
  -webkit-app-region: drag;
  z-index: 10;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.toolbar-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dirty-indicator {
  color: var(--accent);
  font-weight: bold;
  font-size: 18px;
  line-height: 1;
  margin-left: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.tool-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tool-btn:active {
  transform: scale(0.95);
}

.tool-btn.active {
  background: var(--accent-light);
  color: var(--accent);
}

.layout-btn {
  font-size: 16px;
}
</style>
