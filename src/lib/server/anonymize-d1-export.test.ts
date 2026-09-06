import { describe, expect, it } from "vitest";
import { sanitizeSqlExport } from "../../../scripts/anonymize-d1-export.mjs";

describe("sanitizeSqlExport", () => {
	it("keeps five students and rewrites student and parent data", async () => {
		const source = `
			CREATE TABLE students (userid TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, parent_names TEXT, parent_emails TEXT, phone TEXT, parent_phone TEXT, dietary_restrictions TEXT, intolerance_level TEXT, graduation_year TEXT, tshirt_size TEXT, custom_fields TEXT, current_grade TEXT, gender TEXT, hidden INTEGER);
			CREATE TABLE attendance (userid TEXT, timestamp INTEGER);
			CREATE TABLE events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
			CREATE TABLE event_registrations (id TEXT PRIMARY KEY, student_id TEXT, event_id TEXT, paid INTEGER, form_completed INTEGER, invoice_id TEXT, invoice_payment_link TEXT);
			CREATE TABLE user (id TEXT PRIMARY KEY, username TEXT, password_hash TEXT, role TEXT);
			CREATE TABLE parent_student_links (parent_id TEXT, student_id TEXT);
			CREATE TABLE parent_profiles (user_id TEXT, phone TEXT);
			CREATE TABLE carpool_spots (id TEXT PRIMARY KEY, event_id TEXT, mentor_id TEXT, capacity INTEGER, driver_name TEXT);
			CREATE TABLE carpool_assignments (id TEXT PRIMARY KEY, carpool_spot_id TEXT, student_id TEXT);
			CREATE TABLE hotel_rooms (id TEXT PRIMARY KEY, event_id TEXT, room_name TEXT, gender TEXT);
			CREATE TABLE room_assignments (id TEXT PRIMARY KEY, room_id TEXT, student_id TEXT, user_id TEXT);
			${Array.from({ length: 6 }, (_, i) => `INSERT INTO students VALUES ('real-${i}', 'Real${i}', 'Student${i}', 'Parent ${i}', 'parent${i}@real.example', '555-000-${i}', '555-100-${i}', 'peanuts', 'cannot_have', '20${30 + i}', 'L', '{}', '9', 'X', 0);`).join("\n")}
			INSERT INTO attendance VALUES ('real-0', 1), ('real-5', 2);
			INSERT INTO events VALUES ('event-1', '{"name":"Regional","startDate":"2030-01-01"}');
			INSERT INTO event_registrations VALUES ('registration-0', 'real-0', 'event-1', 1, 1, 'invoice-real', 'https://real.example/pay');
			INSERT INTO event_registrations VALUES ('registration-5', 'real-5', 'event-1', 1, 1, 'invoice-other', 'https://real.example/pay');
			INSERT INTO user VALUES ('parent-0', 'parent0@real.example', 'real-hash', 'user');
			INSERT INTO parent_student_links VALUES ('parent-0', 'real-0');
			INSERT INTO parent_profiles VALUES ('parent-0', '555-100-0');
		`;

		const result = await sanitizeSqlExport(source);

		expect(result).toContain("fixture-student-001@example.test");
		expect(result).not.toContain("real-5");
		expect(result).not.toContain("Real0");
		expect(result).not.toContain("parent0@real.example");
		expect(result).not.toContain("invoice-real");
		expect(result).toContain("event-1");
	});
});
