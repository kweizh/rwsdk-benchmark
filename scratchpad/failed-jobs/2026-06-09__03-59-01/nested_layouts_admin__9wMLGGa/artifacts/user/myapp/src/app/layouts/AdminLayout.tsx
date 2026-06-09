import type { ReactNode } from "react";

export function AdminLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <aside>Admin Sidebar</aside>
      {children}
    </>
  );
}

export default AdminLayout;
