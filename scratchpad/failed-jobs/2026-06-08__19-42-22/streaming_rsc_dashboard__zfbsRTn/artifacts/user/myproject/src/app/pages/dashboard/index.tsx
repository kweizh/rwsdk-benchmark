import React, { Suspense } from "react";
import { getRevenue, getUsers, getOrders } from "./queries";

async function RevenuePanel() {
  const revenue = await getRevenue();
  return (
    <div data-panel="revenue" data-state="ready">
      {revenue}
    </div>
  );
}

async function UsersPanel() {
  const users = await getUsers();
  return (
    <div data-panel="users" data-state="ready">
      {users}
    </div>
  );
}

async function OrdersPanel() {
  const orders = await getOrders();
  return (
    <div data-panel="orders" data-state="ready">
      {orders}
    </div>
  );
}

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div data-panel="revenue" data-state="loading">Loading revenue...</div>}>
        <RevenuePanel />
      </Suspense>
      <Suspense fallback={<div data-panel="users" data-state="loading">Loading users...</div>}>
        <UsersPanel />
      </Suspense>
      <Suspense fallback={<div data-panel="orders" data-state="loading">Loading orders...</div>}>
        <OrdersPanel />
      </Suspense>
    </div>
  );
}
