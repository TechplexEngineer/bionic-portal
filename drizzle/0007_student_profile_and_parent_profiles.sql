ALTER TABLE `students` ADD `intolerance_level` text;
--> statement-breakpoint
ALTER TABLE `students` ADD `graduation_year` text;
--> statement-breakpoint
ALTER TABLE `students` ADD `tshirt_size` text;
--> statement-breakpoint
CREATE TABLE `parent_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`phone` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
