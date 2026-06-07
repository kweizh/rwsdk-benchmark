RedwoodSDK distinguishes between data-only queries (`serverQuery`) and state-mutating actions (`serverAction`) that trigger a full page re-render and rehydration cycle.

You need to implement a server action called `addTodo` in `src/actions.ts` that takes a single text payload and inserts it into a Cloudflare D1 database. 

**Constraints:**
- You must wrap the function with `serverAction` imported from `rwsdk/worker`.
- Use the existing Drizzle ORM setup and `todos` schema provided in `src/db/schema.ts`.
- Ensure the function strictly expects a `string` argument and returns the inserted record.