import { Check, Clock, Database, FileText, Hash, Palette, Pencil } from "lucide-react";
import styles from "./StatusBar.module.css";

interface StatusBarProps {
  fileName?: string;
  /** Byte size of the open document, shown when known and non-zero. */
  fileSize?: number;
  words?: number;
  readingMinutes?: number;
  themeName: string;
  /** True when the document has unsaved edits. */
  dirty?: boolean;
}

/** Human-readable byte size, e.g. 2048 -> "2 KB". */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

/**
 * Bottom status bar. The "Source unchanged" indicator reinforces VisionMD's
 * core promise that the underlying .md file is never modified.
 */
export function StatusBar({
  fileName,
  fileSize,
  words,
  readingMinutes,
  themeName,
  dirty = false,
}: StatusBarProps) {
  return (
    <footer className={styles.statusbar}>
      <div className={styles.group}>
        <span className={styles.item} title="Current file">
          <FileText size={13} />
          {fileName ?? "No file open"}
        </span>
        {fileSize !== undefined && fileSize > 0 && (
          <span className={styles.item} title="File size">
            <Database size={13} />
            {formatBytes(fileSize)}
          </span>
        )}
        {words !== undefined && (
          <span className={styles.item} title="Word count">
            <Hash size={13} />
            {words.toLocaleString()} words
          </span>
        )}
        {readingMinutes !== undefined && (
          <span className={styles.item} title="Estimated reading time">
            <Clock size={13} />
            {readingMinutes} min read
          </span>
        )}
      </div>

      <div className={styles.group}>
        <span className={styles.item} title="Active theme">
          <Palette size={13} />
          {themeName}
        </span>
        {fileName &&
          (dirty ? (
            <span className={`${styles.item} ${styles.dirty}`} title="You have unsaved edits">
              <Pencil size={13} />
              Unsaved changes
            </span>
          ) : (
            <span className={`${styles.item} ${styles.safe}`} title="Saved — matches the file on disk">
              <Check size={13} />
              Saved
            </span>
          ))}
      </div>
    </footer>
  );
}
