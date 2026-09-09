import { describe, expect, it } from "vitest";
import type { FormDefinition, FormValues } from "bionic-sign";
import { getAgeOnDate, getFormStatus, getOwnedFields, validateOwnedValues } from "./formWorkflow";

const definition: FormDefinition = {
	version: 1,
	fields: [
		{
			id: "a",
			name: "student_name",
			type: "text",
			page: 1,
			rect: { x: 0, y: 0, width: 0.2, height: 0.1 },
			required: true
		},
		{
			id: "b",
			name: "parent_signature",
			type: "signature",
			page: 1,
			rect: { x: 0.2, y: 0, width: 0.2, height: 0.1 },
			required: true
		},
		{
			id: "c",
			name: "notes",
			type: "text",
			page: 1,
			rect: { x: 0.4, y: 0, width: 0.2, height: 0.1 },
			required: false
		}
	]
};

const textValue = (value: string) => ({ type: "text" as const, value });

describe("form workflow helpers", () => {
	it("calculates age before and after the birthday", () => {
		expect(getAgeOnDate("2010-09-08", new Date("2028-09-07T12:00:00Z"))).toBe(17);
		expect(getAgeOnDate("2010-09-08", new Date("2028-09-08T12:00:00Z"))).toBe(18);
	});

	it("classifies prefixed and unprefixed fields by owner", () => {
		expect(getOwnedFields(definition, "student").map((field) => field.name)).toEqual([
			"student_name",
			"notes"
		]);
		expect(getOwnedFields(definition, "parent").map((field) => field.name)).toEqual([
			"parent_signature"
		]);
	});

	it("rejects values belonging to the other owner", () => {
		const values: FormValues = {
			parent_signature: { type: "signature", image: "data:image/png;base64,AA==" }
		};
		expect(() => validateOwnedValues(definition, values, "student")).toThrow(/student-owned/);
		expect(validateOwnedValues(definition, { student_name: textValue("Alex") }, "student")).toEqual(
			{
				student_name: textValue("Alex")
			}
		);
	});

	it("reports student incomplete, parent pending, and complete states", () => {
		expect(getFormStatus({ definition, studentValues: {}, parentValues: {}, under18: true })).toBe(
			"student-incomplete"
		);
		expect(
			getFormStatus({
				definition,
				studentValues: { student_name: textValue("Alex") },
				parentValues: {},
				under18: true
			})
		).toBe("parent-pending");
		expect(
			getFormStatus({
				definition,
				studentValues: { student_name: textValue("Alex") },
				parentValues: {
					parent_signature: { type: "signature", image: "data:image/png;base64,AA==" }
				},
				under18: true
			})
		).toBe("complete");
	});
});
