import type { ReactNode } from "react";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <header>RedwoodSDK Demo</header>
      <main>{children}</main>
      <footer>© rwsdk demo</footer>
    </div>
  );
};
