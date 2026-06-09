import posts from "@/data/posts.json";

interface Post {
  slug: string;
  title: string;
  author: string;
  published: string;
  body: string;
}

export const Home = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Blog</title>
        <link rel="modulepreload" href="/src/client.tsx" />
      </head>
      <body>
        <h1>My Blog</h1>
        <div>
          {(posts as Post[]).map((post) => (
            <div key={post.slug} style={{ border: "1px solid #ccc", margin: "1rem 0", padding: "1rem", borderRadius: "8px" }}>
              <h2>
                <a href={`/posts/${post.slug}`}>{post.title}</a>
              </h2>
              <p>
                By {post.author} &mdash; {post.published}
              </p>
            </div>
          ))}
        </div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  );
};
