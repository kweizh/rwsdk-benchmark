export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    <header>RedwoodSDK Demo</header>
    {children}
    <footer>© rwsdk demo</footer>
  </>
);
