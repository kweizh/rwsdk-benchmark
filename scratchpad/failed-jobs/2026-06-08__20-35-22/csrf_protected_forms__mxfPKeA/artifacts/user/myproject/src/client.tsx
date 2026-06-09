import { hydrateRoot } from "react-dom/client";

// Minimal client-side hydration entry point
// This app is primarily an API server, so no client-side React is needed
// but rwsdk expects a client entry for SSR hydration

const root = document.getElementById("root");
if (root) {
  hydrateRoot(root, <></>);
}