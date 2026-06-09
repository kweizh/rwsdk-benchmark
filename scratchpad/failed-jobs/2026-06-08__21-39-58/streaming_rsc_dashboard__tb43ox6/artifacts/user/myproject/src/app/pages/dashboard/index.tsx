import { Suspense } from "react";
import { RevenuePanel } from "./revenue-panel.js";
import { UsersPanel } from "./users-panel.js";
import { OrdersPanel } from "./orders-panel.js";

export const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense
        fallback={
          <div data-panel="revenue" data-state="loading">
            Loading revenue...
          </div>
        }
      >
        <RevenuePanel />
      </Suspense>
      <Suspense
        fallback={
          <div data-panel="users" data-state="loading">
            Loading users...
          </div>
        }
      >
        <UsersPanel />
      </Suspense>
      <Suspense
        fallback={
          <div data-panel="orders" data-state="loading">
            Loading orders...
          </div>
        }
      >
        <OrdersPanel />
      </Suspense>
    </div>
  );
};
