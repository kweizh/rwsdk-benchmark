import { route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

export type AppContext = {};

// Shared in-memory user store (both versions read from this)
const users = [
  { id: "u1", name: "Alice", email: "alice@example.com" },
  { id: "u2", name: "Bob", email: "bob@example.com" },
  { id: "u3", name: "Cyrus", email: "cyrus@example.com" },
];

// Middleware: set X-API-Version: 1
function v1VersionMiddleware({ response }: { response: Response }) {
  response.headers.set("X-API-Version", "1");
}

// Middleware: set X-API-Version: 2
function v2VersionMiddleware({ response }: { response: Response }) {
  response.headers.set("X-API-Version", "2");
}

export default defineApp([
  // v1 routes – only {id, name}
  ...prefix("/v1", [
    v1VersionMiddleware,
    route("/users", {
      get: () => {
        const payload = users.map(({ id, name }) => ({ id, name }));
        return Response.json(payload);
      },
    }),
    route("/users/:id", {
      get: ({ params }) => {
        const user = users.find((u) => u.id === params.id);
        if (!user) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        const { id, name } = user;
        return Response.json({ id, name });
      },
    }),
  ]),

  // v2 routes – {id, name, email}
  ...prefix("/v2", [
    v2VersionMiddleware,
    route("/users", {
      get: () => {
        return Response.json(users);
      },
    }),
    route("/users/:id", {
      get: ({ params }) => {
        const user = users.find((u) => u.id === params.id);
        if (!user) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        return Response.json(user);
      },
    }),
  ]),
]);
