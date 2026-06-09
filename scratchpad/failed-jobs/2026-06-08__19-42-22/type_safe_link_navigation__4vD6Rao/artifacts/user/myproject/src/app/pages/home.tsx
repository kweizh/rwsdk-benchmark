import { link } from "@/app/shared/links";
import { USERS } from "@/app/shared/seed";

export const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <ul>
        {USERS.map((user) => (
          <li key={user.id}>
            <a href={link("/users/:id", { id: user.id })}>{user.name}</a>
          </li>
        ))}
      </ul>
      <a href={link("/users")}>All Users</a>
    </div>
  );
};
