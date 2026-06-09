import { Suspense } from "react";
import { getRevenue, getUsers, getRecentOrders } from "./queries";

const RevenuePanel = async () => {
  const revenue = await getRevenue();
  return (
    <div data-panel="revenue" data-state="ready">
      {revenue}
    </div>
  );
};

const UsersPanel = async () => {
  const users = await getUsers();
  return (
    <div data-panel="users" data-state="ready">
      {users}
    </div>
  );
};

const OrdersPanel = async () => {
  const orders = await getRecentOrders();
  return (
    <div data-panel="orders" data-state="ready">
      {orders}
    </div>
  );
};

export const DashboardPage = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
        <Suspense fallback={<div data-panel="revenue" data-state="loading">Loading Revenue...</div>}>
          <RevenuePanel />
        </Suspense>

        <Suspense fallback={<div data-panel="users" data-state="loading">Loading Users...</div>}>
          <UsersPanel />
        </Suspense>

        <Suspense fallback={<div data-panel="orders" data-state="loading">Loading Orders...</div>}>
          <OrdersPanel />
        </Suspense>
      </div>
    </div>
  );
};
