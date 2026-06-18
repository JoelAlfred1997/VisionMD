import type { ReactNode, Ref } from "react";

interface AppShellProps {
  toolbar: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  statusbar: ReactNode;
  sidebarVisible: boolean;
  /** Attached to the scrollable <main> so features (e.g. search) can read it. */
  mainRef?: Ref<HTMLElement>;
}

/**
 * Structural layout: fixed toolbar + status bar with a sidebar/main body.
 * Keeps App.tsx focused on state rather than CSS grid plumbing.
 */
export function AppShell({
  toolbar,
  sidebar,
  main,
  statusbar,
  sidebarVisible,
  mainRef,
}: AppShellProps) {
  return (
    <div className="app-shell">
      {toolbar}
      <div className={`app-body ${sidebarVisible ? "" : "sidebar-hidden"}`}>
        {sidebarVisible && sidebar}
        <main ref={mainRef} className="app-main scrollable">
          {main}
        </main>
      </div>
      {statusbar}
    </div>
  );
}
