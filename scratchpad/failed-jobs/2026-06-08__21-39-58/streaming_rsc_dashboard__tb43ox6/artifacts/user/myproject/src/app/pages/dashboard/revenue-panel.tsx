import { getRevenue } from "./queries.js";

export const RevenuePanel = async () => {
  const data = await getRevenue();
  return (
    <div data-panel="revenue" data-state="ready">
      {data}
    </div>
  );
};
