<template>
  <div
    ref="previewRef"
    class="preview-pane"
    :style="{ fontFamily: settingsStore.fontFamily }"
    @scroll="onScroll"
  >
    <div v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useEditorStore } from "../stores/editor";
import { useSettingsStore } from "../stores/settings";
import { parseMarkdown } from "../utils/markdown";

const editorStore = useEditorStore();
const settingsStore = useSettingsStore();

const previewRef = ref<HTMLDivElement | null>(null);

const emit = defineEmits<{
  scroll: [scrollTop: number, scrollHeight: number, clientHeight: number];
}>();

const renderedContent = computed(() => {
  return parseMarkdown(editorStore.content);
});

function onScroll() {
  if (!previewRef.value) return;
  emit(
    "scroll",
    previewRef.value.scrollTop,
    previewRef.value.scrollHeight,
    previewRef.value.clientHeight,
  );
}

function getScrollInfo() {
  if (!previewRef.value)
    return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
  return {
    scrollTop: previewRef.value.scrollTop,
    scrollHeight: previewRef.value.scrollHeight,
    clientHeight: previewRef.value.clientHeight,
  };
}

function setScrollTop(value: number) {
  if (previewRef.value) {
    previewRef.value.scrollTop = value;
  }
}

defineExpose({ getScrollInfo, setScrollTop, previewRef });
</script>

<style scoped>
@import "../styles/preview.css";
</style>
