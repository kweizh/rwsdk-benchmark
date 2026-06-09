import type { DocumentProps } from "rwsdk/router";

export const MarketingDocument: React.FC<DocumentProps> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Marketing Site</title>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #ffffff;
              color: #1a1a1a;
            }
            .marketing-header {
              background: #f8f8f8;
              border-bottom: 1px solid #e0e0e0;
              padding: 1rem 2rem;
              display: flex;
              align-items: center;
              gap: 1.5rem;
            }
            .marketing-header a {
              color: #1a1a1a;
              text-decoration: none;
              font-weight: 500;
            }
            .marketing-header a:hover {
              text-decoration: underline;
            }
            .marketing-main {
              padding: 2rem;
              max-width: 800px;
              margin: 0 auto;
            }
          `,
        }}
      />
    </head>
    <body>
      <header className="marketing-header">
        <strong>Marketing</strong>
        <a href="/">Home</a>
        <a href="/pricing">Pricing</a>
        <a href="/app">App</a>
      </header>
      <main className="marketing-main">{children}</main>
    </body>
  </html>
);