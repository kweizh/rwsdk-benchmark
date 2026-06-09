import { RequestInfo } from "rwsdk/worker";
import { getUserById } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const UserDetailPage = ({
  params,
}: RequestInfo<{ id: string }>) => {
  const user = getUserById(params.id);

  if (!user) {
    return (
      <main>
        <h1>User not found</h1>
        <a href={link("/users")}>Back to Users</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{user.name}</h1>
      <p>User ID: {user.id}</p>
      <h2>Posts</h2>
      <ul>
        {user.posts.map((post) => (
          <li key={post.id}>
            <a
              href={link("/users/:id/posts/:postId", {
                id: user.id,
                postId: post.id,
              })}
            >
              {post.title}
            </a>
          </li>
        ))}
      </ul>
      <a href={link("/users")}>Back to Users</a>
    </main>
  );
};
