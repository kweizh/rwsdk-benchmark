import { marked } from "marked";
import posts from "@/data/posts.json";
import type { RequestInfo } from "rwsdk/worker";

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ");
}

export async function postDetailHandler({ params }: RequestInfo<{ slug: string }>) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  const bodyHtml = await marked(post.body);
  const metaDesc = htmlEscape(post.body.slice(0, 100));
  const escapedTitle = htmlEscape(post.title);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${metaDesc}" />
  <title>${escapedTitle}</title>
</head>
<body style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
  <p><a href="/">&larr; Back to all posts</a></p>
  <h1>${escapedTitle}</h1>
  <p style="color: #666; font-size: 0.9rem;">By ${htmlEscape(post.author)} &middot; ${htmlEscape(post.publishedAt)}</p>
  <hr />
  ${bodyHtml}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export function postRawHandler({ params }: RequestInfo<{ slug: string }>) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(post.body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
