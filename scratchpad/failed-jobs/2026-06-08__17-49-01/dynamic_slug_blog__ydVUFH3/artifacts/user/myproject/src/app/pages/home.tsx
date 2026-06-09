import React from "react";
import posts from "@/data/posts.json";

export const Home = () => {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header style={{ marginBottom: "40px" }}>
        <h1>My RedwoodSDK Blog</h1>
        <p style={{ color: "#666" }}>Welcome to my server-rendered Markdown blog!</p>
      </header>
      <main>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "20px",
          }}
          className="posts-container"
        >
          {posts.map((post) => (
            <div
              key={post.slug}
              className="post-card"
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <h2 style={{ marginTop: "0" }}>{post.title}</h2>
              <p style={{ margin: "5px 0" }}>
                <strong>By:</strong> {post.author}
              </p>
              <p style={{ margin: "5px 0", color: "#555" }}>
                <strong>Published:</strong> {post.date}
              </p>
              <div style={{ marginTop: "15px" }}>
                <a
                  href={`/posts/${post.slug}`}
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    backgroundColor: "#0070f3",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                  }}
                >
                  Read Post
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
