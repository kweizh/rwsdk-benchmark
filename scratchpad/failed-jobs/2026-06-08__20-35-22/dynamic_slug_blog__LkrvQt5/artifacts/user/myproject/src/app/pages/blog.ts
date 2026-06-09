import { marked } from "marked";
import posts from "@/data/posts.json";

interface Post {
  slug: string;
  title: string;
  author: string;
  published: string;
  body: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function blogIndex(): Promise<Response> {
  const postCards = (posts as Post[])
    .map(
      (post) => `
    <div class="card">
      <h2><a href="/posts/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>
      <p>By ${escapeHtml(post.author)} &middot; ${escapeHtml(post.published)}</p>
    </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blog</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .card { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
    .card h2 { margin: 0 0 0.5rem 0; }
    .card a { color: #0066cc; text-decoration: none; }
    .card a:hover { text-decoration: underline; }
    .card p { color: #666; margin: 0; }
  </style>
</head>
<body>
  <h1>Blog</h1>
  ${postCards}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export async function blogDetail({
  params,
}: {
  params: { slug: string };
}): Promise<Response> {
  const post = (posts as Post[]).find((p) => p.slug === params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  const htmlBody = (await marked(post.body)) as string;
  const description = escapeHtml(post.body.substring(0, 100));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(post.title)}</title>
  <meta name="description" content="${description}">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; }
    .meta { color: #666; margin-bottom: 2rem; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; border-radius: 4px; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 2px; }
    pre code { background: none; padding: 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(post.title)}</h1>
  <div class="meta">By ${escapeHtml(post.author)} &middot; ${escapeHtml(post.published)}</div>
  <div class="content">
    ${htmlBody}
  </div>
  <p><a href="/">Back to all posts</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export async function blogRaw({
  params,
}: {
  params: { slug: string };
}): Promise<Response> {
  const post = (posts as Post[]).find((p) => p.slug === params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(post.body, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}