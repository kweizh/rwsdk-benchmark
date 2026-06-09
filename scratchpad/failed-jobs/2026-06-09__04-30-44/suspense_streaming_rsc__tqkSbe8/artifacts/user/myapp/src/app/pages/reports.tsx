import React, { Suspense } from "react";

const SalesReport = async () => {
  await new Promise((res) => setTimeout(res, 800));
  return <div data-testid="report">Sales total: $12,345</div>;
};

const QuickReport = async () => {
  return <div data-testid="quick">Quick value: 99</div>;
};

export const SalesRoute = () => {
  return (
    <Suspense fallback={<div>Loading sales report…</div>}>
      <SalesReport />
    </Suspense>
  );
};

export const QuickRoute = () => {
  return (
    <Suspense fallback={<div>Loading quick…</div>}>
      <QuickReport />
    </Suspense>
  );
};
