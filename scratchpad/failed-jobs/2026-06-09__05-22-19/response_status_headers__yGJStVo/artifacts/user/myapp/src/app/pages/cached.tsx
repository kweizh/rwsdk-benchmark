import { requestInfo } from "rwsdk/worker";

export const Cached = () => {
  requestInfo.response.status = 200;
  requestInfo.response.headers.set("Cache-Control", "public, max-age=3600");
  requestInfo.response.headers.set("X-Cache-Status", "HIT");
  return <div>cached page</div>;
};