import { users } from "@/app/shared/seed";
import { link } from "@/app/shared/links";

export const UsersPage = () => {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <a href={link("/users/:id", { id: user.id })}>{user.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};