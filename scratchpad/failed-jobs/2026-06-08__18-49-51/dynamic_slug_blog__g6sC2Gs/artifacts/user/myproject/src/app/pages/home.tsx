import posts from "@/data/posts.json";

export const Home = () => {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Blog</h1>
      <div>
        {posts.map((post) => (
          <article
            key={post.slug}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ margin: "0 0 0.5rem" }}>
              <a href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "#0070f3" }}>
                {post.title}
              </a>
            </h2>
            <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
              By {post.author} &middot; {post.publishedAt}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
};
