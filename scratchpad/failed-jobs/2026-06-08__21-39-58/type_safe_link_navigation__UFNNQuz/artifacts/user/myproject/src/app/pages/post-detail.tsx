import { link } from "@/app/shared/links";
import { getPostById } from "@/app/shared/data";

export const PostDetail = ({
  params,
}: {
  params: { id: string; postId: string };
}) => {
  const post = getPostById(params.id, params.postId);

  if (!post) {
    return (
      <div>
        <h1>Post Not Found</h1>
        <p>
          <a href={link("/")}>Back to Home</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>User ID: {params.id}</p>
      <p>Post ID: {params.postId}</p>
      <p>
        <a href={link("/users/:id", { id: params.id })}>
          Back to User
        </a>
      </p>
    </div>
  );
};
