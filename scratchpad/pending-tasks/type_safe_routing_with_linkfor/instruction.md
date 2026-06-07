RedwoodSDK ensures safe route transitions using the `linkFor` primitive, which derives its types from the route definitions provided to `defineApp`. 

You need to generate a type-safe routing helper in `src/components/Navigation.tsx` and implement a link that navigates to a dynamically parameterized user profile page. 

**Constraints:**
- You must import the `App` type from `src/worker.tsx` to strongly type the `linkFor` instantiation.
- Create a valid link to the `/profile/:id` route using an ID of "123".
- Do NOT use standard string literals (e.g., `href="/profile/123"`) directly in an anchor tag; you must use the instantiated `link` function.