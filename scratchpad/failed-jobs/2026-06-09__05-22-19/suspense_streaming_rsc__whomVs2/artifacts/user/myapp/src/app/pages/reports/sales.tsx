import { Suspense } from "react";

async function SalesReport() {
  await new Promise((res) => setTimeout(res, 800));
  return <div data-testid="report">Sales total: $12,345</div>;
}

export const SalesPage = () => {
  return (
    <Suspense fallback={<div>Loading sales report…</div>}>
      <SalesReport />
    </Suspense>
  );
};