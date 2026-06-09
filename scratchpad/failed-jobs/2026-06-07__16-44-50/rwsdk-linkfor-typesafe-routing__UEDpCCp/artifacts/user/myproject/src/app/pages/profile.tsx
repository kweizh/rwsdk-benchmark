import { RequestInfo } from "rwsdk/worker";

export const Profile = ({ params }: RequestInfo<{ id: string }>) => {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Profile Page</h1>
      <p>The user ID is: <span id="profile-id">{params.id}</span></p>
    </main>
  );
};
