import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";

// Configure marked with Prism.js syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: "language-",
    highlight(code: string, lang: string) {
      if (lang && Prism.languages[lang]) {
        try {
          return Prism.highlight(code, Prism.languages[lang], lang);
        } catch {
          // fallback
        }
      }
      return code;
    },
  }),
);

// Use marked's built-in extension mechanism for links
marked.use({
  renderer: {
    link({
      href,
      title,
      text,
    }: {
      href: string;
      title?: string | null;
      text: string;
    }) {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  } as any,
});

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(input: string): string {
  const result = marked.parse(input);
  if (typeof result === "string") return result;
  return result.toString();
}

export function wrapBold(text: string): string {
  return `**${text}**`;
}

export function wrapItalic(text: string): string {
  return `*${text}*`;
}

export function makeHeading(text: string, level: number = 1): string {
  return `${"#".repeat(level)} ${text}`;
}

export function makeListItem(text: string): string {
  return `- ${text}`;
}

export function makeLink(text: string, url: string): string {
  return `[${text}](${url})`;
}
