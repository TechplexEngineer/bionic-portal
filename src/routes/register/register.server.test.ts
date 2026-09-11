import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

function event(fields: Record<string, string>, username = "new.student@billericak12.com") {
	const onConflictDoUpdate = vi.fn();
	const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
	const linkValues = vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn() });
	const insert = vi.fn().mockReturnValueOnce({ values }).mockReturnValue({ values: linkValues });
	const pendingLinks = [{ parentId: "parent-1", studentEmail: "new.student@billericak12.com" }];
	const deleteWhere = vi.fn().mockResolvedValue(undefined);
	const select = vi.fn().mockReturnValue({
		from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(pendingLinks) })
	});

	return {
		input: {
			url: new URL("http://localhost/register"),
			request: new Request("http://localhost/register", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			locals: {
				user: { username },
				db: { insert, select, delete: vi.fn().mockReturnValue({ where: deleteWhere }) }
			}
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		insert,
		values,
		onConflictDoUpdate,
		deleteWhere
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
	gender: "Prefer not to say",
	dateOfBirth: "2010-06-15",
	custom_aspirationsAfterHighSchool: "Attend college and study engineering",
	custom_winterSpringSports: "Yes, I plan to play soccer",
	custom_teamGoals: "Learn new skills and contribute to the team"
};

describe("student registration", () => {
	it("requires a valid date of birth", async () => {
		const { input } = event({ ...validFields, dateOfBirth: "" });
		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: { message: "Date of birth is required" }
		});
	});

	it("links pending parents when the student completes registration", async () => {
		const { input, insert, deleteWhere } = event(validFields);

		await expect(actions.default(input)).rejects.toMatchObject({ status: 303 });
		expect(insert).toHaveBeenCalledTimes(2);
		expect(deleteWhere).toHaveBeenCalled();
	});

	it("requires students to register with a billericak12.com email", async () => {
		const { input, values } = event(validFields, "new.student@example.com");

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: { message: "Student registration requires a @billericak12.com email address" }
		});
		expect(values).not.toHaveBeenCalled();
	});

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

	it("persists the free-text registration questions", async () => {
		const { input, values } = event({
			...validFields,
			custom_aspirationsAfterHighSchool: "Attend college and study engineering",
			custom_winterSpringSports: "Yes, I plan to play soccer",
			custom_teamGoals: "Learn new skills and contribute to the team"
		});

		await expect(actions.default(input)).rejects.toMatchObject({
			status: 303,
			location: "/dashboard"
		});

		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				customFields: JSON.stringify({
					aspirationsAfterHighSchool: "Attend college and study engineering",
					winterSpringSports: "Yes, I plan to play soccer",
					teamGoals: "Learn new skills and contribute to the team"
				})
			})
		);
	});

	it.each(["custom_aspirationsAfterHighSchool", "custom_winterSpringSports", "custom_teamGoals"])(
		"requires an answer to %s",
		async (missingField) => {
			const { input, values } = event({
				...validFields,
				custom_aspirationsAfterHighSchool: "Attend college and study engineering",
				custom_winterSpringSports: "Yes, I plan to play soccer",
				custom_teamGoals: "Learn new skills and contribute to the team",
				[missingField]: ""
			});

			expect(await actions.default(input)).toMatchObject({
				status: 400,
				data: { message: "All additional questions are required" }
			});
			expect(values).not.toHaveBeenCalled();
		}
	);

	it("keeps unrelated save failures generic", async () => {
		const { input, onConflictDoUpdate } = event(validFields);
		onConflictDoUpdate.mockRejectedValue(new Error("database unavailable"));

		expect(await actions.default(input)).toMatchObject({
			status: 500,
			data: { message: "An error occurred while saving your profile." }
		});
	});
});
