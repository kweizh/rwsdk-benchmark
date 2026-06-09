import { link } from "@/app/shared/links";
import { USERS, getPostsForUser } from "@/app/shared/seed";

export const UserDetail = ({ params }: { params: { id: string } }) => {
  const user = USERS.find((u) => u.id === params.id);
  if (!user) return <div>User not found</div>;

  const posts = getPostsForUser(user.name);

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={link("/users/:id/posts/:postId", { id: user.id, postId: post.id })}>
              {post.title}
            </a>
          </li>
        ))}
      </ul>
      <a href={link("/")}>Back Home</a>
    </div>
  );
};
