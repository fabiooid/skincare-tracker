ALTER TABLE `products` ADD `claims` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `animal_derived` text DEFAULT 'unknown' NOT NULL;
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `origin_type` text DEFAULT 'unknown' NOT NULL;
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `organic_certified` text DEFAULT 'unknown' NOT NULL;
