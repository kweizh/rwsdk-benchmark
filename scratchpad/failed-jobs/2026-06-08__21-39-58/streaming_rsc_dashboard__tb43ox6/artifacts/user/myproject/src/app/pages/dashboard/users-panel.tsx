import { getUsers } from "./queries.js";

export const UsersPanel = async () => {
  const data = await getUsers();
  return (
    <div data-panel="users" data-state="ready">
      {data}
    </div>
  );
};
