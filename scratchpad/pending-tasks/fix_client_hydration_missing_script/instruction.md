RedwoodSDK applications operate with a "server-first" philosophy, meaning React components render on the server by default. Developers often experience "dead" interactive elements if they forget to configure the hydration entry point.

You need to restore interactivity to the client-side components by injecting the correct module script into the application's HTML shell within `src/app/document.tsx`. 

**Constraints:**
- Do NOT modify the interactive `Counter.tsx` component.
- You must add a `<script>` tag referencing `/src/client.tsx` with the correct module type.
- Ensure the script is placed correctly within the `<body>` of the Document component.