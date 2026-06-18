import { useCallback } from "react";
import type { OutlineItem } from "../types";
import styles from "./Outline.module.css";

interface OutlineProps {
  items: OutlineItem[];
}

/**
 * Document outline rendered in the sidebar. Each entry scrolls the rendered
 * document to the matching heading anchor (ids come from rehype-slug, mirrored
 * by buildOutline). Indentation reflects heading depth; levels deeper than 3
 * are clamped so the rail stays readable.
 */
export function Outline({ items }: OutlineProps) {
  const handleNavigate = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return; // e.g. raw view has no heading anchors
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav className={styles.outline} aria-label="Document outline">
      <p className={styles.heading}>Outline</p>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`}>
            <button
              type="button"
              className={styles.link}
              style={{ paddingLeft: `${(Math.min(item.level, 3) - 1) * 0.85 + 0.5}rem` }}
              data-level={Math.min(item.level, 3)}
              onClick={() => handleNavigate(item.id)}
              title={item.text}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
