import { Suspense } from "react";

async function QuickReport() {
  return <div data-testid="quick">Quick value: 99</div>;
}

export const QuickPage = () => {
  return (
    <Suspense fallback={<div>Loading quick…</div>}>
      <QuickReport />
    </Suspense>
  );
};