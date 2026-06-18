import { FolderOpen, PanelLeft } from "lucide-react";
import { Logo } from "./Logo";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onOpenFile: () => void;
  onToggleSidebar: () => void;
  /** Right-aligned controls (view mode, theme, search, export) injected by App. */
  children?: React.ReactNode;
}

/** Top application bar: brand on the left, document controls on the right. */
export function Toolbar({ onOpenFile, onToggleSidebar, children }: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <button
          className="btn btn-icon"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <div className={styles.brand}>
          <Logo size={24} />
          <span className={styles.name}>VisionMD</span>
        </div>

        <button className="btn btn-primary" onClick={onOpenFile}>
          <FolderOpen size={16} />
          <span className={styles.openLabel}>Open</span>
        </button>
      </div>

      <div className={styles.right}>{children}</div>
    </header>
  );
}
