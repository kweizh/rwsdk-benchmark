CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
