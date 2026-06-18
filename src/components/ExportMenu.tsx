import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileCode, Printer } from "lucide-react";
import styles from "./ExportMenu.module.css";

interface ExportMenuProps {
  /** Download the rendered document as a self-contained HTML file. */
  onExportHtml: () => void;
  /** Open the print dialog (the user chooses "Save as PDF"). */
  onPrint: () => void;
}

/** Dropdown for exporting the rendered document. Closes on outside click/Escape. */
export function ExportMenu({ onExportHtml, onPrint }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export document"
      >
        <Download size={16} />
        <span className={styles.label}>Export</span>
        <ChevronDown size={14} className={styles.chevron} aria-hidden />
      </button>

      {open && (
        <ul className={styles.menu} role="menu" aria-label="Export">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => run(onExportHtml)}
            >
              <FileCode size={16} aria-hidden />
              <span className={styles.itemText}>
                <span className={styles.itemName}>Save as HTML</span>
                <span className={styles.itemDesc}>Self-contained, offline file.</span>
              </span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => run(onPrint)}
            >
              <Printer size={16} aria-hidden />
              <span className={styles.itemText}>
                <span className={styles.itemName}>Print / Save as PDF</span>
                <span className={styles.itemDesc}>Open the print dialog.</span>
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
