import { link } from "@/app/shared/links";
import { USERS, getPostsForUser } from "@/app/shared/seed";

export const PostDetail = ({ params }: { params: { id: string; postId: string } }) => {
  const user = USERS.find((u) => u.id === params.id);
  if (!user) return <div>User not found</div>;

  const posts = getPostsForUser(user.name);
  const post = posts.find((p) => p.id === params.postId);
  if (!post) return <div>Post not found</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <p>User ID: {params.id}</p>
      <p>Post ID: {params.postId}</p>
      <a href={link("/users/:id", { id: user.id })}>Back to {user.name}</a>
    </div>
  );
};
