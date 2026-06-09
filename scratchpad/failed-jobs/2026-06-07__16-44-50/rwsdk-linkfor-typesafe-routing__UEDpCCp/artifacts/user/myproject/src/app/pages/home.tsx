import { Welcome } from "./welcome.js";
import { link } from "@/app/shared/links";

export const Home = () => {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1>RedwoodSDK App</h1>
        <p>
          <a href={link("/profile/:id", { id: "42" })} style={{ fontSize: "1.2rem", color: "#0070f3", textDecoration: "underline" }}>
            Go to profile 42
          </a>
        </p>
      </header>
      <Welcome />
    </div>
  );
};
