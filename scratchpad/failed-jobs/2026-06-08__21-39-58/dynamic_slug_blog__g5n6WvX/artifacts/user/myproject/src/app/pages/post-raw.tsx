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

export const PostRaw = ({ params }: { params: { slug: string } }) => {
  const post = postsMap.get(params.slug);

  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(post.body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
