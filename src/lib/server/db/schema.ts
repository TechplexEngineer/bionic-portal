import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ----------------------------------------------------------------------------
// Users table
// ----------------------------------------------------------------------------
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("user")
});
export type User = typeof user.$inferSelect;

// ----------------------------------------------------------------------------
// Login Sessions Table
// ----------------------------------------------------------------------------
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
});
export type Session = typeof session.$inferSelect;

// ----------------------------------------------------------------------------
// Students Table
// ----------------------------------------------------------------------------

export const students = sqliteTable(
	"students",
	{
		userid: text("userid").notNull().unique(), // student email
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		parentNames: text("parent_names"), // Comma separated
		parentEmails: text("parent_emails"), // Comma separated
		phone: text("phone"),
		parentPhone: text("parent_phone"), // Comma separated parent phone numbers
		dietaryRestrictions: text("dietary_restrictions"),
		intoleranceLevel: text("intolerance_level"), // "cannot_have" | "epi_pen" | "prefer_not"
		graduationYear: text("graduation_year"),
		tshirtSize: text("tshirt_size"),
		customFields: text("custom_fields"), // JSON string for survey expansion
		currentGrade: text("current_grade"),
		gender: text("gender"),
		dateOfBirth: text("date_of_birth"),
		hidden: integer("hidden", { mode: "boolean" }).notNull().default(false)
	},
	(table) => [unique("uniqueUserName").on(table.firstName, table.lastName)]
);
export type Student = typeof students.$inferSelect;

// ----------------------------------------------------------------------------
// Attendance Table
// ----------------------------------------------------------------------------

export const attendance = sqliteTable("attendance", {
	userid: text("userid")
		.notNull()
		.references(() => students.userid),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});
export type Attendance = typeof attendance.$inferSelect;

// ----------------------------------------------------------------------------
// Shop Locations Table
// ----------------------------------------------------------------------------
export const shopLocations = sqliteTable("shop_locations", {
	id: text("id").primaryKey(),
	location: text("location").notNull().unique(),
	item: text("item").notNull()
});
export type ShopLocation = typeof shopLocations.$inferSelect;

export const shopLocationInsertSchema = createInsertSchema(shopLocations, {
	location: (schema) => schema.min(1).max(100),
	item: (schema) => schema.min(1).max(255)
});

export const studentsRelations = relations(students, ({ many }) => ({
	attendance: many(attendance),
	registrations: many(eventRegistrations)
}));

// Attendance to Students relation
export const attendanceRelations = relations(attendance, ({ one }) => ({
	student: one(students, {
		fields: [attendance.userid],
		references: [students.userid]
	})
}));

// ----------------------------------------------------------------------------
// Competition Events Table
// ----------------------------------------------------------------------------
export interface EventData {
	name: string;
	startDate: string; // ISO string
	endDate: string; // ISO string
	location: string;
	isOvernight: boolean;
	departureTime: string; // ISO string or time string
	returnTime: string; // ISO string or time string
	description?: string;
	hotelAddress?: string;
	permissionFormUrl?: string;
	cost: number;
	registrationDueDate?: string; // ISO string
	studentsPerRoom: number;
	mentorsPerRoom: number;
}

export const events = sqliteTable("events", {
	id: text("id").primaryKey(),
	data: text("data", { mode: "json" }).$type<EventData>().notNull()
});
export type Events = typeof events.$inferSelect;

export const eventInsertSchema = createInsertSchema(events, {
	data: () =>
		z.object({
			name: z.string().min(1),
			startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
				message: "Invalid date format"
			}),
			endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
				message: "Invalid date format"
			}),
			location: z.string().min(1),
			isOvernight: z.boolean().default(false),
			departureTime: z.string().optional(),
			returnTime: z.string().optional(),
			description: z.string().optional(),
			hotelAddress: z.string().optional(),
			permissionFormUrl: z.string().optional(),
			cost: z.number().min(0),
			registrationDueDate: z
				.string()
				.refine((date) => !isNaN(Date.parse(date)), {
					message: "Invalid date format"
				})
				.optional(),
			studentsPerRoom: z.number().min(1).default(4),
			mentorsPerRoom: z.number().min(1).default(2)
		}) as any
});
export type EventInsert = z.infer<typeof eventInsertSchema>;

// ----------------------------------------------------------------------------
// Event Forms Table
// ----------------------------------------------------------------------------
export const eventForms = sqliteTable("event_forms", {
	id: text("id").primaryKey(),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id),
	name: text("name").notNull(),
	basePdfKey: text("base_pdf_key").notNull(),
	definition: text("definition", { mode: "json" }).notNull()
});
export type EventForm = typeof eventForms.$inferSelect;

// ----------------------------------------------------------------------------
// Event Registrations Table
// ----------------------------------------------------------------------------
export const eventRegistrations = sqliteTable("event_registrations", {
	id: text("id").primaryKey(),
	studentId: text("student_id")
		.notNull()
		.references(() => students.userid),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id),
	paid: integer("paid", { mode: "boolean" }).notNull().default(false),
	formCompleted: integer("form_completed", { mode: "boolean" }).notNull().default(false),
	invoiceId: text("invoice_id"), // QuickBooks invoice ID
	invoicePaymentLink: text("invoice_payment_link") // QuickBooks invoice payment link
});

// One row per completed event form. The signed PDF and field values are kept
// in R2/D1 respectively so an admin can audit and export each submission.
export const eventFormSubmissions = sqliteTable(
	"event_form_submissions",
	{
		id: text("id").primaryKey(),
		registrationId: text("registration_id")
			.notNull()
			.references(() => eventRegistrations.id),
		eventFormId: text("event_form_id")
			.notNull()
			.references(() => eventForms.id),
		signedPdfKey: text("signed_pdf_key"),
		values: text("values", { mode: "json" }).notNull().default({}),
		studentValues: text("student_values", { mode: "json" }).notNull().default({}),
		parentValues: text("parent_values", { mode: "json" }).notNull().default({}),
		studentCompleted: integer("student_completed", { mode: "boolean" }).notNull().default(false),
		parentCompleted: integer("parent_completed", { mode: "boolean" }).notNull().default(false),
		completedAt: integer("completed_at", { mode: "timestamp" })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		parentCompletedAt: integer("parent_completed_at", { mode: "timestamp" })
	},
	(table) => [unique("event_form_submission_unique").on(table.registrationId, table.eventFormId)]
);

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
	student: one(students, {
		fields: [eventRegistrations.studentId],
		references: [students.userid]
	}),
	event: one(events, {
		fields: [eventRegistrations.eventId],
		references: [events.id]
	})
}));

export const eventFormsRelations = relations(eventForms, ({ one, many }) => ({
	event: one(events, { fields: [eventForms.eventId], references: [events.id] }),
	submissions: many(eventFormSubmissions)
}));

export const eventFormSubmissionsRelations = relations(eventFormSubmissions, ({ one }) => ({
	registration: one(eventRegistrations, {
		fields: [eventFormSubmissions.registrationId],
		references: [eventRegistrations.id]
	}),
	eventForm: one(eventForms, {
		fields: [eventFormSubmissions.eventFormId],
		references: [eventForms.id]
	})
}));

// One expiring invitation per parent/form workflow attempt. The token itself is never stored.
export const parentFormInvites = sqliteTable("parent_form_invites", {
	id: text("id").primaryKey(),
	submissionId: text("submission_id")
		.notNull()
		.references(() => eventFormSubmissions.id),
	email: text("email").notNull(),
	code: text("code").notNull().unique(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const parentFormInvitesRelations = relations(parentFormInvites, ({ one }) => ({
	submission: one(eventFormSubmissions, {
		fields: [parentFormInvites.submissionId],
		references: [eventFormSubmissions.id]
	})
}));

// ----------------------------------------------------------------------------
// Hotel Rooms Table
// ----------------------------------------------------------------------------
export const hotelRooms = sqliteTable("hotel_rooms", {
	id: text("id").primaryKey(),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id),
	roomName: text("room_name").notNull(),
	gender: text("gender") // "Boys", "Girls", "Mentors", etc.
});

export const hotelRoomsRelations = relations(hotelRooms, ({ one, many }) => ({
	event: one(events, {
		fields: [hotelRooms.eventId],
		references: [events.id]
	}),
	assignments: many(roomAssignments)
}));

// ----------------------------------------------------------------------------
// Room Assignments Table
// ----------------------------------------------------------------------------
export const roomAssignments = sqliteTable("room_assignments", {
	id: text("id").primaryKey(),
	roomId: text("room_id")
		.notNull()
		.references(() => hotelRooms.id),
	studentId: text("student_id").references(() => students.userid),
	userId: text("user_id").references(() => user.id)
});

export const roomAssignmentsRelations = relations(roomAssignments, ({ one }) => ({
	room: one(hotelRooms, {
		fields: [roomAssignments.roomId],
		references: [hotelRooms.id]
	}),
	student: one(students, {
		fields: [roomAssignments.studentId],
		references: [students.userid]
	}),
	user: one(user, {
		fields: [roomAssignments.userId],
		references: [user.id]
	})
}));

// ----------------------------------------------------------------------------
// Carpool Spots Table
// ----------------------------------------------------------------------------
export const carpoolSpots = sqliteTable(
	"carpool_spots",
	{
		id: text("id").primaryKey(),
		eventId: text("event_id")
			.notNull()
			.references(() => events.id),
		mentorId: text("mentor_id")
			.notNull()
			.references(() => user.id),
		capacity: integer("capacity").notNull(),
		driverName: text("driver_name").notNull()
	},
	(table) => [unique("carpool_spot_unique").on(table.eventId, table.mentorId)]
);

export const carpoolSpotsRelations = relations(carpoolSpots, ({ one, many }) => ({
	event: one(events, {
		fields: [carpoolSpots.eventId],
		references: [events.id]
	}),
	mentor: one(user, {
		fields: [carpoolSpots.mentorId],
		references: [user.id]
	}),
	assignments: many(carpoolAssignments)
}));

// ----------------------------------------------------------------------------
// Carpool Assignments Table
// ----------------------------------------------------------------------------
export const carpoolAssignments = sqliteTable("carpool_assignments", {
	id: text("id").primaryKey(),
	carpoolSpotId: text("carpool_spot_id")
		.notNull()
		.references(() => carpoolSpots.id),
	studentId: text("student_id")
		.notNull()
		.references(() => students.userid)
});

export const carpoolAssignmentsRelations = relations(carpoolAssignments, ({ one }) => ({
	carpoolSpot: one(carpoolSpots, {
		fields: [carpoolAssignments.carpoolSpotId],
		references: [carpoolSpots.id]
	}),
	student: one(students, {
		fields: [carpoolAssignments.studentId],
		references: [students.userid]
	})
}));

// ----------------------------------------------------------------------------
// Magic Codes Table
// ----------------------------------------------------------------------------
export const magicCodes = sqliteTable("magic_codes", {
	email: text("email").primaryKey(),
	code: text("code").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull()
});

// ----------------------------------------------------------------------------
// KV Store Table (for tokens, etc.)
// ----------------------------------------------------------------------------
export const kvStore = sqliteTable("kv_store", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ----------------------------------------------------------------------------
// Parent Student Links Table
// ----------------------------------------------------------------------------
export const parentStudentLinks = sqliteTable(
	"parent_student_links",
	{
		parentId: text("parent_id")
			.notNull()
			.references(() => user.id),
		studentId: text("student_id")
			.notNull()
			.references(() => students.userid) // student email
	},
	(table) => [unique("parent_student_unique").on(table.parentId, table.studentId)]
);

export const parentStudentLinksRelations = relations(parentStudentLinks, ({ one }) => ({
	parent: one(user, {
		fields: [parentStudentLinks.parentId],
		references: [user.id]
	}),
	student: one(students, {
		fields: [parentStudentLinks.studentId],
		references: [students.userid]
	})
}));

// ----------------------------------------------------------------------------
// Parent Profiles Table
// ----------------------------------------------------------------------------
export const parentProfiles = sqliteTable("parent_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id),
	phone: text("phone")
});
export type ParentProfile = typeof parentProfiles.$inferSelect;

// ----------------------------------------------------------------------------
// Mentor Profiles Table
// ----------------------------------------------------------------------------
export const mentorProfiles = sqliteTable("mentor_profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text("phone").notNull(),
	company: text("company").notNull(),
	tshirtSize: text("tshirt_size").notNull(),
	firstAlumni: text("first_alumni").notNull(),
	yearsMentoring: text("years_mentoring").notNull(),
	expertise: text("expertise").notNull(),
	motivation: text("motivation")
});
export type MentorProfile = typeof mentorProfiles.$inferSelect;
