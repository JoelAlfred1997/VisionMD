import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock, FileText, X } from "lucide-react";
import type { RecentFile } from "../types";
import styles from "./RecentMenu.module.css";

interface RecentMenuProps {
  recents: RecentFile[];
  /** Reopen a recent file by its stored path. */
  onOpen: (path: string) => void;
  /** Forget a single recent entry. */
  onRemove: (path: string) => void;
  /** Forget every recent entry. */
  onClear: () => void;
}

/**
 * Toolbar dropdown listing recently opened files so they can be reopened
 * without leaving the current document. Closes on outside click/Escape.
 */
export function RecentMenu({
  recents,
  onOpen,
  onRemove,
  onClear,
}: RecentMenuProps) {
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

  if (recents.length === 0) return null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Recent files"
      >
        <Clock size={16} />
        <span className={styles.label}>Recent</span>
        <ChevronDown size={14} className={styles.chevron} aria-hidden />
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label="Recent files">
          <ul className={styles.list}>
            {recents.map((file) => (
              <li key={file.path} role="none" className={styles.row}>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  title={file.path}
                  onClick={() => {
                    setOpen(false);
                    onOpen(file.path);
                  }}
                >
                  <FileText size={16} aria-hidden />
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{file.name}</span>
                    <span className={styles.itemPath}>{file.path}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.remove}
                  title={`Remove ${file.name} from recent files`}
                  aria-label={`Remove ${file.name} from recent files`}
                  onClick={() => onRemove(file.path)}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setOpen(false);
              onClear();
            }}
          >
            Clear recent files
          </button>
        </div>
      )}
    </div>
  );
}
