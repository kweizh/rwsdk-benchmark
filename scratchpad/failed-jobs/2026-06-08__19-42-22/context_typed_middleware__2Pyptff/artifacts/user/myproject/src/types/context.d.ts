import "rwsdk/worker";

declare module "rwsdk/worker" {
  interface DefaultAppContext {
    user: { id: string; role: "admin" | "user" } | null;
    tenant: { id: string; name: string };
    startedAt: number;
  }
}
