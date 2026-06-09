import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";
import { csrfGuard } from "./app/middleware/csrf";
import { handleCsrfToken } from "./app/routes/csrf";
import { handleHealth } from "./app/routes/health";
import { handleComments } from "./app/routes/comments";

export default defineApp([
  // Global CSRF middleware - checks unsafe methods
  csrfGuard,

  // Token issuance endpoint (GET, so exempt from CSRF)
  route("/csrf", handleCsrfToken),

  // Health endpoint (GET, exempt from CSRF)
  route("/api/health", handleHealth),

  // Comments endpoints
  route("/api/comments", handleComments),
]);