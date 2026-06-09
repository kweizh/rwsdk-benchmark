export const MarketingDocument: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Marketing Site</title>
      <style>{`
        body {
          margin: 0;
          font-family: system-ui, sans-serif;
          background: #ffffff;
          color: #111111;
        }
        .marketing-header {
          background: #f0f4ff;
          border-bottom: 1px solid #d0d7e8;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .marketing-header a {
          color: #1a56db;
          text-decoration: none;
          font-weight: 500;
        }
        .marketing-header a:hover {
          text-decoration: underline;
        }
        .marketing-main {
          padding: 40px 24px;
          max-width: 800px;
          margin: 0 auto;
        }
      `}</style>
    </head>
    <body>
      <header className="marketing-header">
        <strong>MarketingSite</strong>
        <nav>
          <a href="/">Home</a>
          <a href="/pricing">Pricing</a>
        </nav>
      </header>
      <main className="marketing-main">{children}</main>
    </body>
  </html>
);
