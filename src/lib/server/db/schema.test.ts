import { expect, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { eventFormSubmissions, eventForms, shopLocations, students } from "./schema";
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
});
