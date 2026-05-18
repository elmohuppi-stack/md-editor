import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useEditorStore = defineStore("editor", () => {
  const content = ref(`# Willkommen beim Markdown Editor

Dies ist ein **Live-Vorschau** Editor.

## Funktionen

- **Split-View**: Editor und Vorschau nebeneinander
- **Preview-Only**: Nur die gerenderte Ansicht
- **Focus-Mode**: Nur der Editor
- **Syntax-Highlighting** für Code-Blöcke
- **Dark/Light Mode**

\`\`\`ts
// Beispiel: TypeScript
const greet = (name: string) => {
  return \`Hallo, \${name}!\`
}
\`\`\`

> *Tipp: Probiere die unterschiedlichen Layout-Modi aus!*
`);
  const filePath = ref<string | null>(null);
  const isDirty = ref(false);
  const undoStack = ref<string[]>([]);

  const fileName = computed(() => {
    if (!filePath.value) return "Neues Dokument";
    return filePath.value.split("/").pop() || "Neues Dokument";
  });

  function setContent(newContent: string) {
    undoStack.value.push(content.value);
    if (undoStack.value.length > 50) {
      undoStack.value.shift();
    }
    content.value = newContent;
    isDirty.value = true;
  }

  function undo() {
    if (undoStack.value.length > 0) {
      content.value = undoStack.value.pop()!;
      isDirty.value = undoStack.value.length > 0 || filePath.value !== null;
    }
  }

  function markSaved() {
    isDirty.value = false;
    undoStack.value = [];
  }

  function reset() {
    content.value = "";
    filePath.value = null;
    isDirty.value = false;
    undoStack.value = [];
  }

  return {
    content,
    filePath,
    isDirty,
    undoStack,
    fileName,
    setContent,
    undo,
    markSaved,
    reset,
  };
});
