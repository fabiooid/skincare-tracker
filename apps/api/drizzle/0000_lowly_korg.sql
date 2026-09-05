CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`mastra_thread_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formula_patches` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`status` text NOT NULL,
	`summary` text NOT NULL,
	`operations` text NOT NULL,
	`agent_message_id` text,
	`created_at` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formula_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`inci` text NOT NULL,
	`cas` text,
	`trade_name` text,
	`function` text NOT NULL,
	`phase` text NOT NULL,
	`percent` real NOT NULL,
	`notes` text,
	`locked` integer DEFAULT false NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `formula_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formula_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`label` text,
	`is_current` integer DEFAULT false NOT NULL,
	`frozen_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingredient_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`market` text NOT NULL,
	`instrument` text NOT NULL,
	`substance` text NOT NULL,
	`inci_names` text NOT NULL,
	`cas_numbers` text,
	`max_percent` real,
	`label_threshold_percent` real,
	`effect` text NOT NULL,
	`citation_url` text NOT NULL,
	`message` text NOT NULL,
	`product_types` text,
	`leave_on_only` integer,
	`ifra_category` text,
	`preferred_inci` text
);
--> statement-breakpoint
CREATE TABLE `pif_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`markdown` text NOT NULL,
	`sections` text NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`markets` text NOT NULL,
	`brief` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regulatory_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`market` text NOT NULL,
	`status` text NOT NULL,
	`hits` text NOT NULL,
	`checked_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`agent_quota_used` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);