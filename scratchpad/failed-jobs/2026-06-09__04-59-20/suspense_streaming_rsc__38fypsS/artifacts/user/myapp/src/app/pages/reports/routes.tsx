import { Suspense } from "react";
import { route } from "rwsdk/router";

async function SalesReport() {
  await new Promise((res) => setTimeout(res, 800));
  return <div data-testid="report">Sales total: $12,345</div>;
}

async function QuickReport() {
  return <div data-testid="quick">Quick value: 99</div>;
}

export const routes = [
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
  route("/json", () =>
    Response.json({ ok: true }, { headers: { "Content-Type": "application/json" } })
  ),
];
