import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** 1-based index of the active match (0 when none). */
  current: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  /** False when the browser lacks the Custom Highlight API. */
  supported: boolean;
}

/** Floating find bar: type to highlight, Enter / arrows to navigate, Esc to close. */
export function SearchBar({
  query,
  onQueryChange,
  current,
  total,
  onNext,
  onPrev,
  onClose,
  supported,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus (and select) the field whenever the bar appears.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const hasQuery = query.length > 0;
  const noMatches = hasQuery && total === 0;

  return (
    <div className={styles.bar} role="search">
      <Search size={15} className={styles.icon} aria-hidden />
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Find in document"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Find in document"
        spellCheck={false}
      />

      <span
        className={`${styles.count} ${noMatches ? styles.countEmpty : ""}`}
        aria-live="polite"
      >
        {!supported
          ? "Unavailable"
          : hasQuery
          ? `${current}/${total}`
          : ""}
      </span>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onPrev}
          disabled={total === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onNext}
          disabled={total === 0}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close search"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
