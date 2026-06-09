import { prefix, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

const users = [
  {id: "u1", name: "Alice", email: "alice@example.com"},
  {id: "u2", name: "Bob", email: "bob@example.com"},
  {id: "u3", name: "Cyrus", email: "cyrus@example.com"}
];

export default defineApp([
  prefix("/v1", [
    ({ response }) => {
      response.headers.set("X-API-Version", "1");
    },
    route("/users", {
      get: () => Response.json(users.map(u => ({ id: u.id, name: u.name })))
    }),
    route("/users/:id", {
      get: ({ params }) => {
        const user = users.find(u => u.id === params.id);
        if (!user) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        return Response.json({ id: user.id, name: user.name });
      }
    })
  ]),
  prefix("/v2", [
    ({ response }) => {
      response.headers.set("X-API-Version", "2");
    },
    route("/users", {
      get: () => Response.json(users)
    }),
    route("/users/:id", {
      get: ({ params }) => {
        const user = users.find(u => u.id === params.id);
        if (!user) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        return Response.json(user);
      }
    })
  ])
]);
