import type { ReactNode } from "react";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <aside>Admin Sidebar</aside>
      <div>{children}</div>
    </div>
  );
};
