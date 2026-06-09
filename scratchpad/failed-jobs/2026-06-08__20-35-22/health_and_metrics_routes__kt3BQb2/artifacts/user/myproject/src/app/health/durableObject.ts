import { DurableObject } from "cloudflare:workers";

export class HealthDurableObject extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async ping(): Promise<string> {
    return "pong";
  }
}