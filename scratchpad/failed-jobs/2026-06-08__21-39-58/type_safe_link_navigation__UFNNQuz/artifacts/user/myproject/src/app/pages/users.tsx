import { link } from "@/app/shared/links";
import { users } from "@/app/shared/data";

export const UsersList = () => {
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
      <p>
        <a href={link("/")}>Back to Home</a>
      </p>
    </div>
  );
};
