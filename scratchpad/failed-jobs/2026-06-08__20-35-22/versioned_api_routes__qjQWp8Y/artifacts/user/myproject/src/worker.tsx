import { defineApp } from "rwsdk/worker";
import { route, prefix } from "rwsdk/router";

// Shared in-memory user store
const users = [
  { id: "u1", name: "Alice", email: "alice@example.com" },
  { id: "u2", name: "Bob", email: "bob@example.com" },
  { id: "u3", name: "Cyrus", email: "cyrus@example.com" },
];

// v1 serializer — omits email
const toV1User = (u: (typeof users)[number]) => ({
  id: u.id,
  name: u.name,
});

// v2 serializer — includes email
const toV2User = (u: (typeof users)[number]) => ({
  id: u.id,
  name: u.name,
  email: u.email,
});

// Middleware that stamps X-API-Version on every response under its prefix
const v1VersionMiddleware = ({ response }: { response: { headers: Headers } }) => {
  response.headers.set("X-API-Version", "1");
};

const v2VersionMiddleware = ({ response }: { response: { headers: Headers } }) => {
  response.headers.set("X-API-Version", "2");
};

export default defineApp([
  prefix("/v1", [
    v1VersionMiddleware,
    route("/users", () => Response.json(users.map(toV1User))),
    route("/users/:id", ({ params }) => {
      const user = users.find((u) => u.id === params.id);
      if (!user) return Response.json({ error: "not_found" }, { status: 404 });
      return Response.json(toV1User(user));
    }),
  ]),
  prefix("/v2", [
    v2VersionMiddleware,
    route("/users", () => Response.json(users.map(toV2User))),
    route("/users/:id", ({ params }) => {
      const user = users.find((u) => u.id === params.id);
      if (!user) return Response.json({ error: "not_found" }, { status: 404 });
      return Response.json(toV2User(user));
    }),
  ]),
]);