import { link } from "../shared/links.js";
import { seedUsers } from "../shared/seed.js";

export const PostDetail = ({ id, postId }: { id: string; postId: string }) => {
  const user = seedUsers.find((u) => u.id === id);
  const post = user?.posts.find((p) => p.id === postId);

  if (!user || !post) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
        <h1>Post Not Found</h1>
        <p>Could not find user ID: {id} or post ID: {postId}</p>
        <p>
          <a href={link("/")}>Go Home</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      <h1>Post Title: {post.title}</h1>
      <p>User ID: <span id="userId">{id}</span></p>
      <p>Post ID: <span id="postId">{postId}</span></p>
      <p>
        <a href={link("/users/:id", { id: user.id })}>Back to User Profile</a>
      </p>
    </div>
  );
};
