export type Post = {
  id: string;
  title: string;
  userId: string;
};

export type User = {
  id: string;
  name: string;
  posts: Post[];
};

export const users: User[] = [
  {
    id: "1",
    name: "Ada",
    posts: [
      { id: "p1", title: "Ada Post 1", userId: "1" },
      { id: "p2", title: "Ada Post 2", userId: "1" },
    ],
  },
  {
    id: "2",
    name: "Bao",
    posts: [
      { id: "p1", title: "Bao Post 1", userId: "2" },
      { id: "p2", title: "Bao Post 2", userId: "2" },
    ],
  },
  {
    id: "3",
    name: "Cyrus",
    posts: [
      { id: "p1", title: "Cyrus Post 1", userId: "3" },
      { id: "p2", title: "Cyrus Post 2", userId: "3" },
    ],
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getPostById(
  userId: string,
  postId: string
): Post | undefined {
  const user = getUserById(userId);
  return user?.posts.find((p) => p.id === postId);
}
