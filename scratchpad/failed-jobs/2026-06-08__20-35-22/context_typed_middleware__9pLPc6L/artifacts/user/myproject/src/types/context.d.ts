export {};

declare module "rwsdk/worker" {
  interface DefaultAppContext {
    user: { id: string; role: "admin" | "user" } | null;
    tenant: { id: string; name: string };
    startedAt: number;
  }

  // Re-export App type to ensure it's available alongside the augmentation
  export type App = typeof import("../worker").default;
}