import type { ReactNode } from "react";
import styles from "./SplitView.module.css";

interface SplitViewProps {
  /** Left pane — typically the rendered document. */
  left: ReactNode;
  /** Right pane — typically the raw Markdown source. */
  right: ReactNode;
}

/**
 * Two equal panes side by side, each filling the available height with its own
 * scroll. The children already manage their internal scroll, so the panes only
 * clip overflow and provide the dividing rule.
 */
export function SplitView({ left, right }: SplitViewProps) {
  return (
    <div className={styles.split}>
      <div className={styles.pane}>{left}</div>
      <div className={`${styles.pane} ${styles.divider}`}>{right}</div>
    </div>
  );
}
