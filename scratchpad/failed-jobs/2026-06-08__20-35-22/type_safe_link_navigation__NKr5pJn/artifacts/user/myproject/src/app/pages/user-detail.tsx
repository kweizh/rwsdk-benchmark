import { getUser, getUserPosts } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const UserDetailPage = ({
  params,
}: {
  params: { id: string };
}) => {
  const user = getUser(params.id);
  if (!user) {
    return <div>User not found</div>;
  }

  const posts = getUserPosts(params.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={link("/users/:id/posts/:postId", { id: params.id, postId: post.id })}>
              {post.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};