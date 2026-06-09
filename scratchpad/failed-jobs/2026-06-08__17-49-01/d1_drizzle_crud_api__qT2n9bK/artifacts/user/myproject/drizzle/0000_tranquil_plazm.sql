CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
