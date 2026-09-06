import { describe, expect, it, vi } from "vitest";
import { getStudentFields } from "$lib/server/studentFields";
import { actions } from "./+page.server";

function event(fields: Record<string, string>) {
	const where = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where });
	const db = {
		update: vi.fn().mockReturnValue({ set }),
		query: { students: { findFirst: vi.fn() } }
	};

	return {
		input: {
			request: new Request("http://localhost/admin/students/student@example.com", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			locals: { db },
			params: { userid: "student@example.com" }
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		set,
		db
	};
}

describe("admin student edit", () => {
	it("derives fields from the students table schema", () => {
		expect(getStudentFields().map((field) => field.key)).toEqual([
			"userid",
			"firstName",
			"lastName",
			"parentNames",
			"parentEmails",
			"phone",
			"parentPhone",
			"dietaryRestrictions",
			"intoleranceLevel",
			"graduationYear",
			"tshirtSize",
			"customFields",
			"currentGrade",
			"gender",
			"hidden"
		]);
		expect(getStudentFields().find((field) => field.key === "hidden")).toMatchObject({
			inputType: "checkbox",
			required: false
		});
	});

	it("updates every submitted field with the correct primitive values", async () => {
		const { input, set } = event({
			userid: "updated@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
			parentNames: "Parent",
			parentEmails: "parent@example.com",
			phone: "555-0100",
			parentPhone: "555-0101",
			dietaryRestrictions: "None",
			intoleranceLevel: "prefer_not",
			graduationYear: "2030",
			tshirtSize: "M",
			customFields: '{"team":"A"}',
			currentGrade: "8",
			gender: "F"
		});

		await expect(actions.default(input)).rejects.toMatchObject({
			status: 303,
			location: "/admin/students/updated%40example.com"
		});
		expect(set).toHaveBeenCalledWith({
			userid: "updated@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
			parentNames: "Parent",
			parentEmails: "parent@example.com",
			phone: "555-0100",
			parentPhone: "555-0101",
			dietaryRestrictions: "None",
			intoleranceLevel: "prefer_not",
			graduationYear: "2030",
			tshirtSize: "M",
			customFields: '{"team":"A"}',
			currentGrade: "8",
			gender: "F",
			hidden: false
		});
	});

	it("rejects missing required values without writing", async () => {
		const { input, db } = event({ userid: "updated@example.com", firstName: "Ada" });

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: { message: "Last Name is required" }
		});
		expect(db.update).not.toHaveBeenCalled();
	});
});
