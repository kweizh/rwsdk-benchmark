export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <div>
    <header>RedwoodSDK Demo</header>
    <main>{children}</main>
    <footer>© rwsdk demo</footer>
  </div>
);
