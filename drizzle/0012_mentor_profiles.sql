CREATE TABLE `mentor_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text NOT NULL,
	`company` text NOT NULL,
	`tshirt_size` text NOT NULL,
	`first_alumni` text NOT NULL,
	`years_mentoring` text NOT NULL,
	`expertise` text NOT NULL,
	`motivation` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
