import { RequestInfo } from "rwsdk/worker";
import { getUserById, getPostById } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const PostDetailPage = ({
  params,
}: RequestInfo<{ id: string; postId: string }>) => {
  const user = getUserById(params.id);
  const post = getPostById(params.id, params.postId);

  if (!user || !post) {
    return (
      <main>
        <h1>Post not found</h1>
        <a href={link("/users")}>Back to Users</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{post.title}</h1>
      <p>User ID: {params.id}</p>
      <p>Post ID: {params.postId}</p>
      <a href={link("/users/:id", { id: params.id })}>
        Back to {user.name}
      </a>
    </main>
  );
};
