import { link } from "@/app/shared/links";
import { getUserById, getPostsByUserId } from "@/app/shared/data";

export const UserDetail = ({ params }: { params: { id: string } }) => {
  const user = getUserById(params.id);

  if (!user) {
    return (
      <div>
        <h1>User Not Found</h1>
        <p>
          <a href={link("/")}>Back to Home</a>
        </p>
      </div>
    );
  }

  const userPosts = getPostsByUserId(user.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <h2>Posts</h2>
      <ul>
        {userPosts.map((post) => (
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
      <p>
        <a href={link("/")}>Back to Home</a>
      </p>
    </div>
  );
};
