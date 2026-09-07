CREATE TABLE `event_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`base_pdf_key` text NOT NULL,
	`definition` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `event_form_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`event_form_id` text NOT NULL,
	`signed_pdf_key` text NOT NULL,
	`values` text NOT NULL,
	`completed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `event_registrations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_form_id`) REFERENCES `event_forms`(`id`) ON UPDATE no action ON DELETE cascade,
	UNIQUE(`registration_id`, `event_form_id`)
);
