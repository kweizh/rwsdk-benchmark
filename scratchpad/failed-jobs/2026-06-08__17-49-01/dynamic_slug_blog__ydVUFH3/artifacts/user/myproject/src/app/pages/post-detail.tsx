import React from "react";

interface Post {
  slug: string;
  title: string;
  author: string;
  date: string;
  body: string;
}

interface PostDetailProps {
  post: Post;
  htmlContent: string;
}

export const PostDetail: React.FC<PostDetailProps> = ({ post, htmlContent }) => {
  return (
    <article style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header>
        <h1>{post.title}</h1>
        <p>
          <strong>By:</strong> {post.author}
        </p>
        <p>
          <strong>Published Date:</strong> {post.date}
        </p>
      </header>
      <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #ccc" }} />
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      <div style={{ marginTop: "40px" }}>
        <a href="/">← Back to Home</a>
      </div>
    </article>
  );
};
