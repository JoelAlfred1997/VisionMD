import { ListTree } from "lucide-react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  /** Outline / recent content injected by App in later phases. */
  children?: React.ReactNode;
  hasDocument: boolean;
}

/**
 * Left rail. Holds the document outline when a file is open, and will show
 * recent files on the home screen (Phase 10). Phase 1 renders the frame.
 */
export function Sidebar({ children, hasDocument }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} scrollable`} aria-label="Document navigation">
      {children ?? (
        <div className={styles.placeholder}>
          <ListTree size={20} />
          <p>{hasDocument ? "No headings in this document." : "Outline appears here once you open a file."}</p>
        </div>
      )}
    </aside>
  );
}
