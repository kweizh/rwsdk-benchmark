import { DurableObject } from "cloudflare:workers";

export class HealthDo extends DurableObject {
  async ping(): Promise<string> {
    return "pong";
  }
}
