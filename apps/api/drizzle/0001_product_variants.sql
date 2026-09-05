CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_selected_final` integer DEFAULT false NOT NULL,
	`maceration_started_at` text,
	`maceration_target_at` text,
	`maceration_notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `formula_versions` ADD `variant_id` text REFERENCES `product_variants`(`id`);
--> statement-breakpoint
ALTER TABLE `formula_patches` ADD `variant_id` text REFERENCES `product_variants`(`id`);
