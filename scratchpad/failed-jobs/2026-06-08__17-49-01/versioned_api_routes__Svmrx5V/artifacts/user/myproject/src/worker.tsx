import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

// Shared in-memory user store
const users = [
  { id: "u1", name: "Alice", email: "alice@example.com" },
  { id: "u2", name: "Bob", email: "bob@example.com" },
  { id: "u3", name: "Cyrus", email: "cyrus@example.com" },
];

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },

  // v1 API Routes
  prefix("/v1", [
    ({ response }) => {
      response.headers.set("X-API-Version", "1");
    },
    route("/users", () => {
      const data = users.map(({ id, name }) => ({ id, name }));
      return Response.json(data);
    }),
    route("/users/:id", ({ params }) => {
      const user = users.find((u) => u.id === params.id);
      if (!user) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
      return Response.json({ id: user.id, name: user.name });
    }),
  ]),

  // v2 API Routes
  prefix("/v2", [
    ({ response }) => {
      response.headers.set("X-API-Version", "2");
    },
    route("/users", () => {
      return Response.json(users);
    }),
    route("/users/:id", ({ params }) => {
      const user = users.find((u) => u.id === params.id);
      if (!user) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
      return Response.json(user);
    }),
  ]),

  render(Document, [route("/", Home)]),
]);
