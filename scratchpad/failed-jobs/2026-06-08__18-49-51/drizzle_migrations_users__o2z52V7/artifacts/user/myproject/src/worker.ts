import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";
import { handleRegister, handleLogin, handleListUsers } from "./api/auth";

export default defineApp([
  route("/api/auth/register", {
    post: ({ request }) => handleRegister(request),
  }),
  route("/api/auth/login", {
    post: ({ request }) => handleLogin(request),
  }),
  route("/api/users", {
    get: () => handleListUsers(),
  }),
]);
