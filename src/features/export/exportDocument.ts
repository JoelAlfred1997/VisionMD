/**
 * Document export — produce a faithful, themed, fully self-contained copy of the
 * rendered Markdown document for sharing or archiving.
 *
 * Both paths (download as HTML, print to PDF) build the *same* standalone HTML
 * string: the live-rendered document markup (Shiki highlighting and Mermaid SVGs
 * already baked in) plus every loaded stylesheet inlined into a single <style>.
 * The result is offline — no network, no external assets — and never touches the
 * user's original `.md` file.
 */

/** Strip a supported Markdown extension to get a base title / filename stem. */
function baseName(name: string): string {
  return name.replace(/\.(md|markdown|mdown|mkd)$/i, "") || "document";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/**
 * Inline every accessible stylesheet so the export carries its own styling. Some
 * sheets (cross-origin) throw on `cssRules` access — those are simply skipped.
 */
function collectStyles(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // Inaccessible (e.g. cross-origin) sheet.
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) css += rule.cssText + "\n";
  }
  return css;
}

/**
 * Export-only overrides appended after the inlined app styles: unclamp the
 * document scroll container (it's fixed-height in the app), give the page sane
 * print margins, and force background/token colors to print faithfully.
 */
const EXPORT_OVERRIDES = `
/* --- VisionMD export overrides --- */
html, body { height: auto; margin: 0; }
body.vmd-export { background: var(--doc-bg); }
.vmd-export .markdown-scroll {
  height: auto;
  overflow: visible;
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
}
@page { margin: 18mm; }
@media print {
  body.vmd-export {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .vmd-export .markdown-body { max-width: none; }
}
`;

interface ExportInput {
  /** Document file name, e.g. "README.md". */
  name: string;
  /** Active theme id, applied to the export's <html data-theme>. */
  theme: string;
  /** outerHTML of the rendered `.markdown-scroll` (frontmatter + body). */
  contentHtml: string;
}

/** Assemble a complete, standalone HTML document for the given content. */
export function buildExportDocument({ name, theme, contentHtml }: ExportInput): string {
  const title = baseName(name);
  return `<!doctype html>
<html lang="en" data-theme="${escapeAttr(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="generator" content="VisionMD" />
<title>${escapeHtml(title)}</title>
<style>
${collectStyles()}${EXPORT_OVERRIDES}</style>
</head>
<body class="vmd-export">
${contentHtml}
</body>
</html>`;
}

/** Download the export as a self-contained `.html` file. */
export function exportToHtmlFile(input: ExportInput): void {
  const html = buildExportDocument(input);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${baseName(input.name)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Open the export in a hidden iframe and trigger the browser print dialog
 * (the user picks "Save as PDF" there). Printing the iframe — rather than the
 * app window — keeps the output free of app chrome and independent of the
 * current view mode. The iframe is removed once printing finishes.
 */
export function printDocument(input: ExportInput): void {
  const html = buildExportDocument(input);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      return;
    }
    const remove = () => {
      if (document.body.contains(iframe)) iframe.remove();
    };
    win.addEventListener("afterprint", () => setTimeout(remove, 0), {
      once: true,
    });
    // Safety net if `afterprint` never fires (some print backends).
    setTimeout(remove, 60_000);
    win.focus();
    win.print();
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}
