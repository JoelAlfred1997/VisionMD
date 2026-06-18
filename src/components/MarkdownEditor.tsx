import { MarkdownViewer } from "../features/markdown/markdownRenderer";
import { SplitView } from "./SplitView";
import styles from "./MarkdownEditor.module.css";

interface MarkdownEditorProps {
  /** Current Markdown source being edited. */
  content: string;
  /** Called with the new source on every edit. */
  onChange: (value: string) => void;
  /** Whether the active theme is dark (passed to the live preview). */
  isDark: boolean;
}

/**
 * Live split editor: an editable Markdown source pane on the left and a live
 * rendered preview on the right. The preview updates as you type.
 */
export function MarkdownEditor({ content, onChange, isDark }: MarkdownEditorProps) {
  return (
    <SplitView
      left={
        <div className={`${styles.editorPane} scrollable`}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Write Markdown here…"
            aria-label="Markdown source editor"
          />
        </div>
      }
      right={<MarkdownViewer content={content} isDark={isDark} />}
    />
  );
}
