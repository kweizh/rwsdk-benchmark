import React from "react";
import { ThemeToggle } from "./components/ThemeToggle";

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
          background-color: #ffffff;
          color: #121212;
        }
        .marketing-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .marketing-header a {
          margin-right: 1rem;
          color: #007bff;
          text-decoration: none;
        }
        .page-container {
          padding: 2rem;
        }
      `}</style>
    </head>
    <body data-theme="light">
      <header className="marketing-header">
        <div>
          <strong>My Marketing Site</strong>
        </div>
        <nav>
          <a href="/">Home</a>
          <a href="/pricing">Pricing</a>
          <a href="/app">Go to App</a>
        </nav>
      </header>
      <div className="page-container">
        {children}
      </div>
    </body>
  </html>
);

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
        body {
          margin: 0;
          font-family: system-ui, sans-serif;
          transition: background-color 0.3s, color 0.3s;
        }
        body[data-theme="light"] {
          background-color: #ffffff;
          color: #121212;
        }
        body[data-theme="dark"] {
          background-color: #121212;
          color: #ffffff;
        }
        .app-header {
          background-color: #212529;
          border-bottom: 1px solid #343a40;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #ffffff;
        }
        .app-header a {
          margin-right: 1rem;
          color: #0d6efd;
          text-decoration: none;
        }
        body[data-theme="dark"] .app-header a {
          color: #6ea8fe;
        }
        .page-container {
          padding: 2rem;
        }
        button {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          border-radius: 4px;
          border: 1px solid #ccc;
          background-color: #fff;
          color: #000;
        }
        body[data-theme="dark"] button {
          background-color: #333;
          color: #fff;
          border-color: #555;
        }
      `}</style>
    </head>
    <body data-theme="dark">
      <header className="app-header">
        <div>
          <strong>My App Shell</strong>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/app">Dashboard</a>
          <a href="/app/profile">Profile</a>
          <a href="/app/settings">Settings</a>
          <a href="/">Exit App</a>
          <ThemeToggle />
        </nav>
      </header>
      <div className="page-container">
        {children}
      </div>
    </body>
  </html>
);
