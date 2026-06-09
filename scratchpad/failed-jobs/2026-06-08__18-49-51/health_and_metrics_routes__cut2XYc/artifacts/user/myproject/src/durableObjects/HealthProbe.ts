export class HealthProbe {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/ping") {
      return new Response("pong", { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }

  async ping(): Promise<string> {
    return "pong";
  }
}
