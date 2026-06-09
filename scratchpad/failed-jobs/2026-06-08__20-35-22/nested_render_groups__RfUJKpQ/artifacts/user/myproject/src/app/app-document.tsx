import type { DocumentProps } from "rwsdk/router";

export const AppDocument: React.FC<DocumentProps> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>App</title>
      <script type="module" src="/src/client.tsx"></script>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #1a1a2e;
              color: #e0e0e0;
            }
            body[data-theme="light"] {
              background: #f0f0f0;
              color: #1a1a1a;
            }
            .app-header {
              background: #16213e;
              border-bottom: 1px solid #0f3460;
              padding: 1rem 2rem;
              display: flex;
              align-items: center;
              gap: 1.5rem;
            }
            .app-header a {
              color: #e0e0e0;
              text-decoration: none;
              font-weight: 500;
            }
            .app-header a:hover {
              text-decoration: underline;
            }
            .app-main {
              padding: 2rem;
              max-width: 800px;
              margin: 0 auto;
            }
          `,
        }}
      />
    </head>
    <body data-theme="dark">
      <header className="app-header">
        <strong>App</strong>
        <a href="/">Home</a>
        <a href="/app">Dashboard</a>
        <a href="/app/profile">Profile</a>
        <a href="/app/settings">Settings</a>
      </header>
      <main className="app-main">{children}</main>
    </body>
  </html>
);