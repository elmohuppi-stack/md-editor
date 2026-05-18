import { defineStore } from "pinia";
import { ref, watch } from "vue";

type Theme = "system" | "light" | "dark";
type LayoutMode = "split" | "preview" | "focus";

const FONT_OPTIONS = [
  { label: "Inter", value: "'Inter', -apple-system, sans-serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Source Serif", value: "'Source Serif 4', Georgia, serif" },
  {
    label: "System Default",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
] as const;

export const useSettingsStore = defineStore("settings", () => {
  const theme = ref<Theme>("system");
  const layoutMode = ref<LayoutMode>("split");
  const fontFamily = ref(FONT_OPTIONS[0].value);

  function applyTheme(selectedTheme: Theme) {
    const root = document.documentElement;
    if (selectedTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", selectedTheme);
    }
  }

  watch(theme, (val) => applyTheme(val), { immediate: true });

  // Sync with OS theme changes
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (theme.value === "system") {
          applyTheme("system");
        }
      });
  }

  function setLayoutMode(mode: LayoutMode) {
    layoutMode.value = mode;
  }

  function setTheme(t: Theme) {
    theme.value = t;
  }

  function setFont(font: string) {
    fontFamily.value = font as any;
  }

  return {
    theme,
    layoutMode,
    fontFamily,
    FONT_OPTIONS,
    applyTheme,
    setLayoutMode,
    setTheme,
    setFont,
  };
});
