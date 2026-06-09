import { route } from "rwsdk/router";
import type { RequestInfo } from "rwsdk/worker";

// Shared in-memory user store
const users = [
  { id: "u1", name: "Alice", email: "alice@example.com" },
  { id: "u2", name: "Bob", email: "bob@example.com" },
  { id: "u3", name: "Cyrus", email: "cyrus@example.com" },
];

// Helper to find a user by ID
function findUser(id: string) {
  return users.find((u) => u.id === id);
}

// GET /users — returns all users
const listUsers = ({ response }: RequestInfo) => {
  const version = response.headers.get("X-API-Version");

  if (version === "1") {
    // v1: id, name only (no email)
    return Response.json(users.map(({ id, name }) => ({ id, name })));
  }

  // v2: id, name, email
  return Response.json(users);
};

// GET /users/:id — returns a single user
const getUser = ({ params, response }: RequestInfo<{ id: string }>) => {
  const user = findUser(params.id);

  if (!user) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const version = response.headers.get("X-API-Version");

  if (version === "1") {
    // v1: id, name only (no email)
    return Response.json({ id: user.id, name: user.name });
  }

  // v2: id, name, email
  return Response.json(user);
};

export const userRoutes = [
  route("/users", {
    get: listUsers,
  }),
  route("/users/:id", {
    get: getUser,
  }),
];
