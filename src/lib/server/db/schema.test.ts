import { expect, describe, it } from "vitest";
import { shopLocations, students } from "./schema";
import { getTableColumns } from "drizzle-orm";

describe("Database Schema tests", () => {
	it("students schema has currentGrade and gender columns", () => {
		const columns = getTableColumns(students);
		expect(columns).toHaveProperty("currentGrade");
		expect(columns).toHaveProperty("gender");
	});

	it("shop locations schema has editable location and item columns", () => {
		const columns = getTableColumns(shopLocations);
		expect(columns).toHaveProperty("location");
		expect(columns).toHaveProperty("item");
	});
});
