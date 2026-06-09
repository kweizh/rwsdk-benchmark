import { getRevenue, getUsers, getOrders } from "./queries";

export async function RevenuePanel() {
  const value = await getRevenue();
  return (
    <div data-panel="revenue" data-state="ready">
      <h2>Revenue</h2>
      <p>{value}</p>
    </div>
  );
}

export async function UsersPanel() {
  const value = await getUsers();
  return (
    <div data-panel="users" data-state="ready">
      <h2>Users</h2>
      <p>{value}</p>
    </div>
  );
}

export async function OrdersPanel() {
  const value = await getOrders();
  return (
    <div data-panel="orders" data-state="ready">
      <h2>Recent Orders</h2>
      <p>{value}</p>
    </div>
  );
}
