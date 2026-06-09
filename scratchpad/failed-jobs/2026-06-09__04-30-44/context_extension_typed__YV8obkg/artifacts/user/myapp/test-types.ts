import { defineApp } from "rwsdk/worker";
defineApp([
  ({ ctx }) => {
    ctx.user?.id;
    ctx.user?.role;
    ctx.requestId;
  }
]);
