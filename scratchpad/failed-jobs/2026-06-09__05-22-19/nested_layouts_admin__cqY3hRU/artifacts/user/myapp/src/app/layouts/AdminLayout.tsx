import React from "react";

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <div>
    <aside>Admin Sidebar</aside>
    <div>{children}</div>
  </div>
);