export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <aside>Admin Sidebar</aside>
    {children}
  </>
);
