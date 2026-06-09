import { getRevenue, getUsers, getOrders } from "./queries.js";

export async function RevenuePanel() {
  const revenue = await getRevenue();
  return <div data-panel="revenue" data-state="ready">{revenue}</div>;
}

export async function UsersPanel() {
  const users = await getUsers();
  return <div data-panel="users" data-state="ready">{users}</div>;
}

export async function OrdersPanel() {
  const orders = await getOrders();
  return <div data-panel="orders" data-state="ready">{orders}</div>;
}