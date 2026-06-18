import { useEffect, useRef, useState } from "react";
import { ChevronDown, FilePlus, Save } from "lucide-react";
import styles from "./SaveMenu.module.css";

interface SaveMenuProps {
  /** Whether the document has unsaved edits (shows a dot + primary styling). */
  dirty: boolean;
  /** Save to the current file (or prompt for a location if there isn't one). */
  onSave: () => void;
  /** Always prompt for a new file location. */
  onSaveAs: () => void;
}

/**
 * Split button: the main part saves in one click; the chevron opens a small
 * menu with "Save As…". A dot marks unsaved changes. Menu closes on outside
 * click / Escape (mirrors ExportMenu).
 */
export function SaveMenu({ dirty, onSave, onSaveAs }: SaveMenuProps) {
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

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`btn ${dirty ? "btn-primary" : ""} ${styles.save}`}
        onClick={onSave}
        title={dirty ? "Save changes (Ctrl+S)" : "Save (Ctrl+S)"}
      >
        <Save size={16} />
        <span className={styles.label}>Save</span>
        {dirty && <span className={styles.dot} aria-label="Unsaved changes" />}
      </button>
      <button
        type="button"
        className={`btn btn-icon ${styles.caret}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More save options"
        aria-label="More save options"
      >
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <ul className={styles.menu} role="menu" aria-label="Save options">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => {
                setOpen(false);
                onSaveAs();
              }}
            >
              <FilePlus size={16} aria-hidden />
              <span className={styles.itemText}>
                <span className={styles.itemName}>Save As…</span>
                <span className={styles.itemDesc}>Write to a new file (Ctrl+Shift+S).</span>
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
