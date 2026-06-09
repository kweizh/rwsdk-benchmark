import { link } from "../shared/links.js";
import { seedUsers } from "../shared/seed.js";

export const Home = () => {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      <h1>Home Page</h1>
      <p>Welcome to our RedwoodSDK app! Here are our users:</p>
      <ul>
        {seedUsers.map((user) => (
          <li key={user.id}>
            <a href={link("/users/:id", { id: user.id })}>{user.name}</a>
          </li>
        ))}
      </ul>
      <p>
        View the <a href={link("/users")}>Flat Users List</a>
      </p>
    </div>
  );
};
