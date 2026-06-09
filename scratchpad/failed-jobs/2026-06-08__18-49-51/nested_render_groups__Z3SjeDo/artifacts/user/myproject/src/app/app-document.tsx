import { ThemeToggle } from "@/app/components/theme-toggle";

export const AppDocument: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>App Shell</title>
      <script type="module" src="/src/client.tsx"></script>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; background: #1a1a2e; color: #e0e0e0; }
        body[data-theme="light"] { background: #f5f5f5; color: #111111; }
        body[data-theme="light"] .app-header { background: #e8eaf6; border-bottom-color: #c5cae9; }
        body[data-theme="light"] .app-header a { color: #333; }
        .app-header { background: #16213e; padding: 1rem 2rem; border-bottom: 1px solid #0f3460; display: flex; align-items: center; gap: 1rem; }
        .app-header a { text-decoration: none; color: #a0b4d0; font-weight: 600; }
        .app-header a:hover { color: #e0e0e0; }
        main { max-width: 960px; margin: 0 auto; padding: 2rem; }
        .theme-toggle-btn { margin-left: auto; padding: 0.4rem 0.9rem; border-radius: 4px; border: 1px solid #0f3460; background: #0f3460; color: #e0e0e0; cursor: pointer; font-size: 0.875rem; }
        .theme-toggle-btn:hover { background: #1a4a7a; }
      `}</style>
    </head>
    <body data-theme="dark">
      <header className="app-header">
        <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>App</span>
        <nav>
          <a href="/app">Dashboard</a>
          &nbsp;|&nbsp;
          <a href="/app/profile">Profile</a>
          &nbsp;|&nbsp;
          <a href="/app/settings">Settings</a>
        </nav>
        <ThemeToggle />
      </header>
      <main>{children}</main>
    </body>
  </html>
);
