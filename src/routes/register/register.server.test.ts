import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

function event(fields: Record<string, string>) {
	const onConflictDoUpdate = vi.fn();
	const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
	const insert = vi.fn().mockReturnValue({ values });

	return {
		input: {
			request: new Request("http://localhost/register", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			locals: {
				user: { username: "new.student@example.com" },
				db: { insert }
			}
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		onConflictDoUpdate
	};
}

const validFields = {
	firstName: "Alex",
	lastName: "Smith",
	parentNames: "Parent Smith",
	parentEmails: "parent@example.com",
	parentPhones: "555-0100",
	graduationYear: "2030",
	tshirtSize: "M",
	intoleranceLevel: "none",
	currentGrade: "9",
	gender: "Prefer not to say"
};

describe("student registration", () => {
	it("preserves the registration URL when redirecting an unauthenticated user to login", async () => {
		const input = {
			url: new URL("https://portal.example.org/register"),
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0];

		await expect(load(input)).rejects.toMatchObject({
			status: 302,
			location: "/login?next=%2Fregister"
		});
	});

	it("shows a friendly message when the student name is already registered", async () => {
		const { input, onConflictDoUpdate } = event(validFields);
		onConflictDoUpdate.mockRejectedValue(
			new Error("UNIQUE constraint failed: students.first_name, students.last_name")
		);

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: {
				message:
					"A student with this name is already registered. If this is you, please sign in with your existing account."
			}
		});
	});

	it("keeps unrelated save failures generic", async () => {
		const { input, onConflictDoUpdate } = event(validFields);
		onConflictDoUpdate.mockRejectedValue(new Error("database unavailable"));

		expect(await actions.default(input)).toMatchObject({
			status: 500,
			data: { message: "An error occurred while saving your profile." }
		});
	});
});
