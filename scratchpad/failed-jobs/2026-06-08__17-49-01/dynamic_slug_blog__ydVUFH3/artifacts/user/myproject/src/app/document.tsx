import React from "react";
import type { DocumentProps } from "rwsdk/router";

export const Document: React.FC<DocumentProps<any>> = ({
  ctx,
  children,
}) => {
  const title = ctx?.title || "My RedwoodSDK Blog";
  const description = ctx?.description;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=optional"
          precedence="first"
        />
        <link rel="modulepreload" href="/src/client.tsx" />
      </head>
      <body>
        {children}
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
