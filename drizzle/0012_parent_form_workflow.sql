ALTER TABLE `students` ADD `date_of_birth` text;
--> statement-breakpoint
CREATE TABLE `event_form_submissions_new` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`event_form_id` text NOT NULL,
	`signed_pdf_key` text,
	`values` text DEFAULT '{}' NOT NULL,
	`student_values` text DEFAULT '{}' NOT NULL,
	`parent_values` text DEFAULT '{}' NOT NULL,
	`student_completed` integer DEFAULT false NOT NULL,
	`parent_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`parent_completed_at` integer,
	FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_form_id`) REFERENCES `event_forms`(`id`) ON UPDATE no action ON DELETE cascade,
	UNIQUE(`registration_id`, `event_form_id`)
);
--> statement-breakpoint
INSERT INTO `event_form_submissions_new` (
	`id`, `registration_id`, `event_form_id`, `signed_pdf_key`, `values`, `student_values`,
	`parent_values`, `student_completed`, `parent_completed`, `completed_at`, `parent_completed_at`
)
SELECT `id`, `registration_id`, `event_form_id`, `signed_pdf_key`, `values`, '{}', '{}',
	true, true, `completed_at`, NULL
FROM `event_form_submissions`;
--> statement-breakpoint
DROP TABLE `event_form_submissions`;
--> statement-breakpoint
ALTER TABLE `event_form_submissions_new` RENAME TO `event_form_submissions`;
--> statement-breakpoint
CREATE TABLE `parent_form_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `event_form_submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_form_invites_code_unique` ON `parent_form_invites` (`code`);
