export interface Post {
  id: string;
  title: string;
}

export interface User {
  id: string;
  name: string;
  posts: Post[];
}

export const seedUsers: User[] = [
  {
    id: "1",
    name: "Ada",
    posts: [
      { id: "p1", title: "Ada Post 1" },
      { id: "p2", title: "Ada Post 2" },
    ],
  },
  {
    id: "2",
    name: "Bao",
    posts: [
      { id: "p1", title: "Bao Post 1" },
      { id: "p2", title: "Bao Post 2" },
    ],
  },
  {
    id: "3",
    name: "Cyrus",
    posts: [
      { id: "p1", title: "Cyrus Post 1" },
      { id: "p2", title: "Cyrus Post 2" },
    ],
  },
];
