import { Suspense } from "react";
import { RevenuePanel, UsersPanel, OrdersPanel } from "./panels.js";

function RevenueFallback() {
  return <div data-panel="revenue" data-state="loading">Loading revenue...</div>;
}

function UsersFallback() {
  return <div data-panel="users" data-state="loading">Loading users...</div>;
}

function OrdersFallback() {
  return <div data-panel="orders" data-state="loading">Loading orders...</div>;
}

export const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<RevenueFallback />}>
        <RevenuePanel />
      </Suspense>
      <Suspense fallback={<UsersFallback />}>
        <UsersPanel />
      </Suspense>
      <Suspense fallback={<OrdersFallback />}>
        <OrdersPanel />
      </Suspense>
    </div>
  );
};