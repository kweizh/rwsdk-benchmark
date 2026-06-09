import { requestInfo } from "rwsdk/worker";

export const Teapot = () => {
  requestInfo.response.status = 418;
  requestInfo.response.headers.set("Content-Language", "en");
  return <div>I am a teapot</div>;
};