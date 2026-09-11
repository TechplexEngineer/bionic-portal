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
		delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
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

	it("saves an unregistered student email as a pending link", async () => {
		const { input, insert } = event([]);

		await expect(actions.default(input)).rejects.toMatchObject({ status: 303 });
		expect(insert).toHaveBeenCalledTimes(2);
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

	it("saves pending links when submitted students are not registered yet", async () => {
		const { input, insert } = event(
			[{ userid: "first@school.edu", firstName: "Alex", lastName: "Student" }],
			["first@school.edu", "missing@school.edu"]
		);

		await expect(actions.default(input)).rejects.toMatchObject({ status: 303 });
		expect(insert).toHaveBeenCalledTimes(3);
	});

	it("rejects malformed student emails before saving the parent profile", async () => {
		const { input, insert } = event([], ["not-an-email"]);

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: { message: "Enter a valid student email address." }
		});
		expect(insert).not.toHaveBeenCalled();
	});

	it("saves a valid unregistered student email as pending", async () => {
		const { input, insert } = event([], ["future@school.edu"]);

		await expect(actions.default(input)).rejects.toMatchObject({ status: 303 });
		expect(insert).toHaveBeenCalledTimes(2);
	});

	it("removes a pending student email for the signed-in parent", async () => {
		const { input } = event([], ["future@school.edu"]);
		input.request = new Request("http://localhost/register/parent", {
			method: "POST",
			body: new URLSearchParams({ studentEmail: "Future@School.edu" })
		});

		const removeAction = actions.removePendingStudent;
		expect(removeAction).toBeDefined();
		expect(await removeAction!(input)).toEqual({ success: true });
	});
});
