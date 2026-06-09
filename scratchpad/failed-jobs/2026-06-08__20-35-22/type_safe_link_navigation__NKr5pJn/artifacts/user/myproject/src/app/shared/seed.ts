export interface User {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
}

export const users: User[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Bao" },
  { id: "3", name: "Cyrus" },
];

export const posts: Post[] = [
  { id: "p1", userId: "1", title: "Ada Post 1" },
  { id: "p2", userId: "1", title: "Ada Post 2" },
  { id: "p1", userId: "2", title: "Bao Post 1" },
  { id: "p2", userId: "2", title: "Bao Post 2" },
  { id: "p1", userId: "3", title: "Cyrus Post 1" },
  { id: "p2", userId: "3", title: "Cyrus Post 2" },
];

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getUserPosts(userId: string): Post[] {
  return posts.filter((p) => p.userId === userId);
}

export function getPost(userId: string, postId: string): Post | undefined {
  return posts.find((p) => p.userId === userId && p.id === postId);
}