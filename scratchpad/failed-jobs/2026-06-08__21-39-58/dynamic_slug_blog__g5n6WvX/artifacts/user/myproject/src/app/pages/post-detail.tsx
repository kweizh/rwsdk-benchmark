import { marked } from "marked";
import posts from "@/data/posts.json";

interface Post {
  slug: string;
  title: string;
  author: string;
  published: string;
  body: string;
}

const postsMap = new Map<string, Post>(
  (posts as Post[]).map((p) => [p.slug, p])
);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const PostDetail = ({ params }: { params: { slug: string } }) => {
  const post = postsMap.get(params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  const htmlBody = marked.parse(post.body) as string;
  const description = escapeHtml(post.body.slice(0, 100));

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{post.title}</title>
        <meta name="description" content={description} />
        <link rel="modulepreload" href="/src/client.tsx" />
      </head>
      <body>
        <h1>{post.title}</h1>
        <p>
          By {post.author} &mdash; {post.published}
        </p>
        <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
        <p>
          <a href="/">← Back to all posts</a>
        </p>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
