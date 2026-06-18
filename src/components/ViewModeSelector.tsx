import { Code, Columns, FileText } from "lucide-react";
import type { ViewMode } from "../types";
import styles from "./ViewModeSelector.module.css";

interface ViewModeSelectorProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

interface ModeOption {
  id: ViewMode;
  label: string;
  icon: typeof FileText;
  title: string;
}

/** Order shown in the segmented control. */
const MODES: ModeOption[] = [
  { id: "document", label: "Document", icon: FileText, title: "Rendered document" },
  { id: "raw", label: "Raw", icon: Code, title: "Raw Markdown source" },
  { id: "split", label: "Split", icon: Columns, title: "Document and source side by side" },
];

/** Segmented control for choosing how the open document is displayed. */
export function ViewModeSelector({ mode, onChange }: ViewModeSelectorProps) {
  return (
    <div className={styles.group} role="group" aria-label="View mode">
      {MODES.map(({ id, label, icon: Icon, title }) => {
        const active = id === mode;
        return (
          <button
            key={id}
            type="button"
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onChange(id)}
            aria-pressed={active}
            title={title}
          >
            <Icon size={16} />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
