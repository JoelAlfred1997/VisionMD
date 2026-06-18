import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Moon, Palette, Sun } from "lucide-react";
import { THEMES } from "../features/theme/themes";
import type { ThemeId } from "../types";
import styles from "./ThemeSelector.module.css";

interface ThemeSelectorProps {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

/** Dropdown for picking the active theme. Lists every built-in theme with its
 *  description and a light/dark hint. Closes on outside click or Escape. */
export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  // Close on outside click or Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (id: ThemeId) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Change theme"
      >
        <Palette size={16} />
        <span className={styles.current}>{active.name}</span>
        <ChevronDown size={14} className={styles.chevron} aria-hidden />
      </button>

      {open && (
        <ul className={styles.menu} role="menu" aria-label="Theme">
          {THEMES.map((t) => {
            const isActive = t.id === theme;
            return (
              <li key={t.id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                  onClick={() => select(t.id)}
                >
                  <span className={styles.itemIcon} aria-hidden>
                    {t.isDark ? <Moon size={15} /> : <Sun size={15} />}
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{t.name}</span>
                    <span className={styles.itemDesc}>{t.description}</span>
                  </span>
                  {isActive && <Check size={15} className={styles.check} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
