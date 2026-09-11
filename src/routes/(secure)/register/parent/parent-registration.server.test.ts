import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

function event(
	students: { userid: string; firstName: string; lastName: string }[],
	studentEmails = [" Student@School.edu "]
) {
	const profileConflict = vi.fn().mockResolvedValue(undefined);
	const linkConflict = vi.fn().mockResolvedValue(undefined);
	const insert = vi
		.fn()
		.mockReturnValueOnce({
			values: vi.fn().mockReturnValue({ onConflictDoUpdate: profileConflict })
		})
		.mockReturnValue({
			values: vi.fn().mockReturnValue({ onConflictDoNothing: linkConflict })
		});
	let studentIndex = 0;
	const where = vi.fn().mockImplementation(async () => {
		const student = students[studentIndex++];
		return student ? [student] : [];
	});
	const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	const db = {
		select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where }) }),
		insert,
		update: vi.fn().mockReturnValue({ set })
	};
	const body = new URLSearchParams({
		phone: "555-0100",
		educationLevel: "College",
		degree: "Engineering",
		jobTitle: "Engineer"
	});
	for (const email of studentEmails) body.append("studentEmail", email);

	return {
		input: {
			url: new URL("http://localhost/register/parent"),
			request: new Request("http://localhost/register/parent", {
				method: "POST",
				body
			}),
			locals: { user: { id: "parent-1", username: "parent@example.com", role: "user" }, db }
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		insert,
		set
	};
}

describe("parent registration", () => {
	it("links a signed-in parent account to the student matching the school email", async () => {
		const { input, insert, set } = event([
			{
				userid: "student@school.edu",
				firstName: "Alex",
				lastName: "Student"
			}
		]);

		await expect(actions.default(input)).rejects.toMatchObject({
			status: 303,
			location: "/dashboard/parent"
		});
		expect(insert).toHaveBeenCalledTimes(2);
		expect(insert.mock.calls[1]).toBeDefined();
		expect(set).toHaveBeenCalledWith({ role: "parent" });
	});

	it("does not create a link when the student email is not registered", async () => {
		const { input, insert } = event([]);

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: {
				message:
					"No student found with that email address: student@school.edu. Please make sure your student has registered first."
			}
		});
		expect(insert).not.toHaveBeenCalled();
	});

	it("links multiple students in one submission", async () => {
		const { input, insert } = event(
			[
				{ userid: "first@school.edu", firstName: "Alex", lastName: "Student" },
				{ userid: "second@school.edu", firstName: "Sam", lastName: "Student" }
			],
			["first@school.edu", "second@school.edu"]
		);

		await expect(actions.default(input)).rejects.toMatchObject({ status: 303 });
		expect(insert).toHaveBeenCalledTimes(3);
	});

	it("does not save anything when one submitted student is missing", async () => {
		const { input, insert } = event(
			[{ userid: "first@school.edu", firstName: "Alex", lastName: "Student" }],
			["first@school.edu", "missing@school.edu"]
		);

		expect(await actions.default(input)).toMatchObject({ status: 400 });
		expect(insert).not.toHaveBeenCalled();
	});
});
