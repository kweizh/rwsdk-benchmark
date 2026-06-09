import { link } from "../shared/links.js";
import { seedUsers } from "../shared/seed.js";

export const UserDetail = ({ id }: { id: string }) => {
  const user = seedUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
        <h1>User Not Found</h1>
        <p>Could not find a user with ID: {id}</p>
        <p>
          <a href={link("/")}>Go Home</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      <h1>User: {user.name}</h1>
      <p>ID: {user.id}</p>
      <h2>Posts:</h2>
      <ul>
        {user.posts.map((post) => (
          <li key={post.id}>
            <a href={link("/users/:id/posts/:postId", { id: user.id, postId: post.id })}>
              {post.title}
            </a>
          </li>
        ))}
      </ul>
      <p>
        <a href={link("/users")}>Back to Users List</a> | <a href={link("/")}>Go Home</a>
      </p>
    </div>
  );
};
