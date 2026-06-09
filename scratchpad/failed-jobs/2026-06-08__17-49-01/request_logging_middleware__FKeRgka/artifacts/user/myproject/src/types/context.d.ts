import "rwsdk/worker";

declare module "rwsdk/worker" {
  interface DefaultAppContext {
    requestId: string;
  }
  export type App = typeof import("../worker").default;
}
