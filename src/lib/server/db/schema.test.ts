import { expect, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import {
	eventFormSubmissions,
	eventForms,
	parentFormInvites,
	shopLocations,
	students
} from "./schema";
import { getTableColumns } from "drizzle-orm";

const studentProfileRepairMigration = readFileSync(
	"drizzle/0010_repair_student_profile_columns.sql",
	"utf8"
);
const originalStudentProfileMigration = readFileSync(
	"drizzle/0007_student_profile_and_parent_profiles.sql",
	"utf8"
);

describe("Database Schema tests", () => {
	it("students schema has currentGrade and gender columns", () => {
		const columns = getTableColumns(students);
		expect(columns).toHaveProperty("currentGrade");
		expect(columns).toHaveProperty("gender");
	});

	it("has a repair migration for student profile columns", () => {
		expect(originalStudentProfileMigration).not.toContain("current_grade");
		expect(originalStudentProfileMigration).not.toContain("gender");
		expect(studentProfileRepairMigration).toContain(
			"ALTER TABLE `students` ADD `current_grade` text;"
		);
		expect(studentProfileRepairMigration).toContain("ALTER TABLE `students` ADD `gender` text;");
	});

	it("shop locations schema has editable location and item columns", () => {
		const columns = getTableColumns(shopLocations);
		expect(columns).toHaveProperty("location");
		expect(columns).toHaveProperty("item");
	});

	it("event forms keep R2 documents separate from definitions and submissions", () => {
		expect(getTableColumns(eventForms)).toEqual(
			expect.objectContaining({ basePdfKey: expect.anything(), definition: expect.anything() })
		);
		expect(getTableColumns(eventFormSubmissions)).toEqual(
			expect.objectContaining({ signedPdfKey: expect.anything(), values: expect.anything() })
		);
	});

	it("supports student DOB and parent form workflow columns", () => {
		expect(getTableColumns(students)).toHaveProperty("dateOfBirth");
		expect(getTableColumns(eventFormSubmissions)).toEqual(
			expect.objectContaining({
				studentValues: expect.anything(),
				parentValues: expect.anything(),
				studentCompleted: expect.anything(),
				parentCompleted: expect.anything(),
				parentCompletedAt: expect.anything()
			})
		);
		expect(getTableColumns(eventFormSubmissions).signedPdfKey.notNull).toBe(false);
		expect(getTableColumns(parentFormInvites)).toEqual(
			expect.objectContaining({
				id: expect.anything(),
				submissionId: expect.anything(),
				email: expect.anything(),
				code: expect.anything(),
				expiresAt: expect.anything(),
				consumedAt: expect.anything()
			})
		);
	});
});
