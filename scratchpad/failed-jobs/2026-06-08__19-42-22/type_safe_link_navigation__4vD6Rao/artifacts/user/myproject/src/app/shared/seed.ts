export const USERS = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Bao" },
  { id: "3", name: "Cyrus" },
];

export const getPostsForUser = (userName: string) => [
  { id: "p1", title: `${userName} Post 1` },
  { id: "p2", title: `${userName} Post 2` },
];
