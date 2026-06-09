"use server";

import { serverQuery } from "rwsdk/worker";

export const getRevenue = serverQuery(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "$12,345";
});

export const getUsers = serverQuery(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return "1,024 active users";
});

export const getOrders = serverQuery(async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return "7 orders today";
});
