import type { AppContext } from "../src/worker";

declare module "rwsdk/worker" {
  interface DefaultAppContext {
    user?: {
      id: string;
      role: "admin" | "member" | "guest";
    };
    requestId?: string;
  }

  export type App = typeof import("../src/worker").default;
}
