import posts from "../../data/posts.json";

export const Home = () => {
  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h2>{post.title}</h2>
            <p>By {post.author}</p>
            <p>Published on {post.publishedDate}</p>
            <a href={`/posts/${post.slug}`}>Read more</a>
          </li>
        ))}
      </ul>
    </div>
  );
};
