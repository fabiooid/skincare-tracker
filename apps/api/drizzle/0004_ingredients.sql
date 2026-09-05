CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`inci` text NOT NULL,
	`trade_name` text,
	`cas` text,
	`category` text DEFAULT 'other' NOT NULL,
	`stock_status` text DEFAULT 'in_house' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
