import { Clock, FileText, FolderOpen, ShieldCheck, X } from "lucide-react";
import { Logo } from "./Logo";
import type { RecentFile } from "../types";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  onOpenFile: () => void;
  /** True while a drag is hovering the window, to invite the drop. */
  isDragging?: boolean;
  /** Recently opened files, most-recent first. */
  recents?: RecentFile[];
  /** Reopen a recent file by its stored path. */
  onOpenRecent?: (path: string) => void;
  /** Forget a single recent entry. */
  onRemoveRecent?: (path: string) => void;
  /** Forget every recent entry. */
  onClearRecents?: () => void;
}

/**
 * Home screen shown before any document is open. Communicates the core
 * promise: beautiful viewing, with the source kept local and unchanged.
 */
export function EmptyState({
  onOpenFile,
  isDragging,
  recents = [],
  onOpenRecent,
  onRemoveRecent,
  onClearRecents,
}: EmptyStateProps) {
  return (
    <div
      className={`${styles.empty} ${isDragging ? styles.dragging : ""}`}
      data-testid="empty-state"
    >
      <div className={styles.card}>
        <div className={styles.mark}>
          <Logo size={48} />
        </div>
        <h1 className={styles.title}>VisionMD</h1>
        <p className={styles.tagline}>
          Markdown for machines. Beautiful documents for humans.
        </p>

        <p className={styles.lead}>
          Open a Markdown file to transform it into a beautiful reading
          experience.
        </p>

        <button className="btn btn-primary" onClick={onOpenFile}>
          <FolderOpen size={16} />
          Open Markdown file
        </button>

        <p className={styles.hint}>
          <FileText size={14} /> or drag &amp; drop a <code>.md</code> file
          anywhere
        </p>

        {recents.length > 0 && (
          <section className={styles.recent} aria-label="Recent files">
            <header className={styles.recentHead}>
              <span className={styles.recentTitle}>
                <Clock size={13} /> Recent files
              </span>
              {onClearRecents && (
                <button
                  type="button"
                  className={styles.recentClear}
                  onClick={onClearRecents}
                >
                  Clear
                </button>
              )}
            </header>
            <ul className={styles.recentList}>
              {recents.map((file) => (
                <li key={file.path} className={styles.recentRow}>
                  <button
                    type="button"
                    className={styles.recentItem}
                    title={file.path}
                    onClick={() => onOpenRecent?.(file.path)}
                  >
                    <FileText size={15} aria-hidden />
                    <span className={styles.recentText}>
                      <span className={styles.recentName}>{file.name}</span>
                      <span className={styles.recentPath}>{file.path}</span>
                    </span>
                  </button>
                  {onRemoveRecent && (
                    <button
                      type="button"
                      className={styles.recentRemove}
                      title={`Remove ${file.name} from recent files`}
                      aria-label={`Remove ${file.name} from recent files`}
                      onClick={() => onRemoveRecent(file.path)}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className={styles.privacy}>
          <ShieldCheck size={14} /> Your file stays local and unchanged.
        </p>
      </div>
    </div>
  );
}
