import { getUser, getPost } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const PostDetailPage = ({
  params,
}: {
  params: { id: string; postId: string };
}) => {
  const user = getUser(params.id);
  const post = getPost(params.id, params.postId);
  if (!user || !post) {
    return <div>Post not found</div>;
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>User ID: {params.id}</p>
      <p>Post ID: {params.postId}</p>
      <a href={link("/users/:id", { id: params.id })}>Back to {user.name}</a>
    </div>
  );
};