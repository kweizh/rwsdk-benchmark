export const SalesReport = async () => {
  await new Promise((res) => setTimeout(res, 800));
  return <div data-testid="report">Sales total: $12,345</div>;
};
