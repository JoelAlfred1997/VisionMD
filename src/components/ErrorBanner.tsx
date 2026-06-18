import { AlertTriangle, X } from "lucide-react";
import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Dismissible inline error, e.g. unsupported file type or read failure. */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <AlertTriangle size={16} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      <button
        className={styles.close}
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <X size={15} />
      </button>
    </div>
  );
}
