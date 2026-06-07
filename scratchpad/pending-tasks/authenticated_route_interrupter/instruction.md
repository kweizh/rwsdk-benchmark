The `defineApp` entry point handles request routing via an array of middleware and route handlers. Protecting private routes requires explicitly intercepting unauthorized requests.

You need to write an authentication interrupter in `src/worker.tsx` that checks for a valid `session` cookie and protects the `/dashboard` route from unauthenticated access. 

**Constraints:**
- The interrupter must parse the cookie from the incoming request.
- Unauthenticated requests must receive a standard 302 Response redirecting to `/login`.
- Do NOT apply the interrupter to the public `/` or `/login` routes.