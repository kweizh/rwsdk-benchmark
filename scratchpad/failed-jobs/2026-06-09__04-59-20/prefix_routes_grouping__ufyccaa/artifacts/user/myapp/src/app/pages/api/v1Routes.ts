import { route } from "rwsdk/router";

export const v1Routes = [
  route("/ping", function handler() {
    return Response.json({ version: "v1", pong: true }, { status: 200 });
  }),

  route("/echo/:msg", function handler({ params }) {
    return Response.json(
      { version: "v1", echo: params.msg },
      { status: 200 }
    );
  }),

  route("/users/:id/profile", function handler({ params }) {
    return Response.json(
      { version: "v1", userId: params.id, profile: true },
      { status: 200 }
    );
  }),
];
