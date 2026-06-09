import { getRecentOrders } from "./queries.js";

export const OrdersPanel = async () => {
  const data = await getRecentOrders();
  return (
    <div data-panel="orders" data-state="ready">
      {data}
    </div>
  );
};
