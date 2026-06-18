import styles from "./RawViewer.module.css";

interface RawViewerProps {
  content: string;
}

/**
 * Shows the original Markdown source verbatim in a monospace surface.
 * Renders read-only text — this view exists to prove the source is untouched.
 */
export function RawViewer({ content }: RawViewerProps) {
  return (
    <div className={`${styles.raw} scrollable`}>
      <pre className={styles.pre}>
        <code>{content}</code>
      </pre>
    </div>
  );
}
