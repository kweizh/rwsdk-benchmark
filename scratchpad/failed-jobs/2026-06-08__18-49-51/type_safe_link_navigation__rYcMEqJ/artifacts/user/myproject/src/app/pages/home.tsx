import { users } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const Home = () => {
  return (
    <main>
      <h1>Home</h1>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <a href={link("/users/:id", { id: user.id })}>{user.name}</a>
          </li>
        ))}
      </ul>
      <a href={link("/users")}>View all users</a>
    </main>
  );
};
