export const MarketingDocument: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Marketing Site</title>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; background: #ffffff; color: #111111; }
        .marketing-header { background: #f0f4f8; padding: 1rem 2rem; border-bottom: 1px solid #d0d8e4; display: flex; align-items: center; gap: 1rem; }
        .marketing-header a { text-decoration: none; color: #333; font-weight: 600; }
        .marketing-header a:hover { color: #0070f3; }
        main { max-width: 960px; margin: 0 auto; padding: 2rem; }
      `}</style>
    </head>
    <body>
      <header className="marketing-header">
        <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>Acme Inc.</span>
        <nav>
          <a href="/">Home</a>
          &nbsp;|&nbsp;
          <a href="/pricing">Pricing</a>
        </nav>
      </header>
      <main>{children}</main>
    </body>
  </html>
);
