export {};

declare module "rwsdk/worker" {
  interface DefaultAppContext {
    user: { id: string; role: "admin" | "user" } | null;
    tenant: { id: string; name: string };
    startedAt: number;
  }

  // App is the type of your defineApp export in src/worker.tsx
  export type App = typeof import("../worker").default;
}
