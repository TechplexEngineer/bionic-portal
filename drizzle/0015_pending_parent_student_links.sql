CREATE TABLE `pending_parent_student_links` (
	`parent_id` text NOT NULL,
	`student_email` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `pending_parent_student_unique` UNIQUE(`parent_id`, `student_email`)
);
