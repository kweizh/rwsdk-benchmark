/**
 * Comments storage (in-memory, per-process).
 */
interface Comment {
  id: number;
  author: string;
  text: string;
}

const comments: Comment[] = [];
let nextId = 1;

/**
 * Handle /api/comments with method-based routing:
 * - GET: list all comments (public, no CSRF needed)
 * - POST: create a comment (CSRF-protected by global middleware)
 */
export const handleComments = {
  get: listComments,
  post: createComment,
};

/**
 * GET /api/comments - List all comments.
 */
function listComments(): Response {
  return new Response(JSON.stringify(comments), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/comments - Create a new comment.
 * CSRF protection is handled by the global middleware before this handler runs.
 * This handler assumes the request has been validated.
 * Supports both JSON and form-urlencoded content types.
 */
async function createComment({ request }: { request: Request }): Promise<Response> {
  const contentType = request.headers.get("Content-Type") || "";
  let author: string | undefined;
  let text: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    author = (body as Record<string, unknown>).author as string;
    text = (body as Record<string, unknown>).text as string;
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const body = await request.text();
    const params = new URLSearchParams(body);
    author = params.get("author") ?? undefined;
    text = params.get("text") ?? undefined;
  } else {
    return new Response(JSON.stringify({ error: "unsupported_content_type" }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!author || !text) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const comment: Comment = {
    id: nextId++,
    author,
    text,
  };

  comments.push(comment);

  return new Response(JSON.stringify(comment), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}