<template>
  <div class="editor-pane">
    <textarea
      ref="editorRef"
      :value="editorStore.content"
      :style="{ fontFamily: settingsStore.fontFamily }"
      placeholder="Starte mit dem Schreiben..."
      @input="onInput"
      @scroll="onScroll"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useEditorStore } from "../stores/editor";
import { useSettingsStore } from "../stores/settings";

const editorStore = useEditorStore();
const settingsStore = useSettingsStore();

const editorRef = ref<HTMLTextAreaElement | null>(null);

const emit = defineEmits<{
  scroll: [scrollTop: number, scrollHeight: number, clientHeight: number];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  editorStore.setContent(target.value);
}

function onScroll() {
  if (!editorRef.value) return;
  emit(
    "scroll",
    editorRef.value.scrollTop,
    editorRef.value.scrollHeight,
    editorRef.value.clientHeight,
  );
}

function getScrollInfo() {
  if (!editorRef.value)
    return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
  return {
    scrollTop: editorRef.value.scrollTop,
    scrollHeight: editorRef.value.scrollHeight,
    clientHeight: editorRef.value.clientHeight,
  };
}

function setScrollTop(value: number) {
  if (editorRef.value) {
    editorRef.value.scrollTop = value;
  }
}

defineExpose({ getScrollInfo, setScrollTop, editorRef });
</script>

<style scoped>
@import "../styles/editor.css";
</style>
