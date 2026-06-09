import { requestInfo } from "rwsdk/worker";

export const Forbidden = () => {
  requestInfo.response.status = 403;
  requestInfo.response.headers.set("X-Reason", "forbidden");

  return <p>nope!</p>;
};
