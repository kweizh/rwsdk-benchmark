import { Suspense } from "react";

export const SalesReport = async () => {
  await new Promise((res) => setTimeout(res, 800));
  return <div data-testid="report">Sales total: $12,345</div>;
};

export const SalesReportPage = () => {
  return (
    <Suspense fallback={<div>Loading sales report…</div>}>
      <SalesReport />
    </Suspense>
  );
};

export const QuickReport = async () => {
  return <div data-testid="quick">Quick value: 99</div>;
};

export const QuickReportPage = () => {
  return (
    <Suspense fallback={<div>Loading quick…</div>}>
      <QuickReport />
    </Suspense>
  );
};
