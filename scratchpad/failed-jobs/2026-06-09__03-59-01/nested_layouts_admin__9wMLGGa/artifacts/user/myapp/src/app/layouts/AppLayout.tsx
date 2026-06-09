import type { ReactNode } from "react";

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <>
      <header>RedwoodSDK Demo</header>
      {children}
      <footer>© rwsdk demo</footer>
    </>
  );
}

export default AppLayout;
