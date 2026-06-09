import { link } from "../shared/links.js";
import { seedUsers } from "../shared/seed.js";

export const Users = () => {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      <h1>Users Flat List</h1>
      <ul>
        {seedUsers.map((user) => (
          <li key={user.id}>
            <a href={link("/users/:id", { id: user.id })}>{user.name}</a>
          </li>
        ))}
      </ul>
      <p>
        <a href={link("/")}>Back to Home</a>
      </p>
    </div>
  );
};
