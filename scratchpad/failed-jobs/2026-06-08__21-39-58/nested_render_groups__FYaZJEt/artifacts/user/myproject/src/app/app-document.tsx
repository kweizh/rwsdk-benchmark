export const AppDocument: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>App Dashboard</title>
      <script type="module" src="/src/client.tsx"></script>
      <style>{`
        body {
          margin: 0;
          font-family: system-ui, sans-serif;
          background: #1a1a2e;
          color: #e0e0e0;
        }
        .app-header {
          background: #16213e;
          border-bottom: 1px solid #0f3460;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .app-header a {
          color: #53a8ff;
          text-decoration: none;
          font-weight: 500;
        }
        .app-header a:hover {
          text-decoration: underline;
        }
        .app-main {
          padding: 40px 24px;
          max-width: 800px;
          margin: 0 auto;
        }
      `}</style>
    </head>
    <body>
      <header className="app-header">
        <strong>AppDashboard</strong>
        <nav>
          <a href="/app">Dashboard</a>
          <a href="/app/profile">Profile</a>
          <a href="/app/settings">Settings</a>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </body>
  </html>
);
