import { marked } from "marked";
import posts from "../../data/posts.json";

export const Post = ({ params }: { params: { slug: string } }) => {
  const post = posts.find((p) => p.slug === params.slug);
  
  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  const htmlBody = marked.parse(post.body) as string;
  const rawDescription = post.body.slice(0, 100);
  const escapedDescription = rawDescription
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return (
    <>
      <title>{post.title}</title>
      <meta name="description" content={escapedDescription} />
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
    </>
  );
};
