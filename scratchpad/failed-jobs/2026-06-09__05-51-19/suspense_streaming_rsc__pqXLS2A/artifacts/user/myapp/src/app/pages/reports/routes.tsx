import { route } from "rwsdk/router";
import { Suspense } from "react";

import { SalesReport } from "./sales";
import { QuickReport } from "./quick";

export const reportsRoutes = [
  route("/sales", () => (
    <Suspense fallback={<div>Loading sales report…</div>}>
      <SalesReport />
    </Suspense>
  )),
  route("/quick", () => (
    <Suspense fallback={<div>Loading quick…</div>}>
      <QuickReport />
    </Suspense>
  )),
  route("/json", () => {
    return Response.json({ ok: true });
  }),
];
