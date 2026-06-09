import { defineApp, route } from "rwsdk/router";
import { register, login, listUsers } from "./routes/auth";

export default defineApp([
  route("/api/auth/register", {
    post: ({ request }) => register(request),
  }),
  route("/api/auth/login", {
    post: ({ request }) => login(request),
  }),
  route("/api/users", {
    get: () => listUsers(),
  }),
]);
