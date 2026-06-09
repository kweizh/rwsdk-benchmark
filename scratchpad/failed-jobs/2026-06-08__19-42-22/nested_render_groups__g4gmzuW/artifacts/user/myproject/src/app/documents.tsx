import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export const MarketingDocument: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Marketing</title>
    </head>
    <body data-theme="light">
      <header className="marketing-header">Marketing Header</header>
      {children}
    </body>
  </html>
);

export const AppDocument: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>App</title>
      <script type="module" src="/src/client.tsx"></script>
    </head>
    <body data-theme="dark">
      <header className="app-header">
        App Header
        <ThemeToggle />
      </header>
      {children}
    </body>
  </html>
);
