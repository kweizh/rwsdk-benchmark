declare module "rwsdk/worker" {
  interface DefaultAppContext {
    user?: {
      id: string;
      role: "admin" | "member" | "guest";
    };
    requestId?: string;
  }
}
