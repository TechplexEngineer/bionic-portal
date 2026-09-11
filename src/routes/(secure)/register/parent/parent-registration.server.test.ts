import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

function event(student: { userid: string; firstName: string; lastName: string } | null) {
	const profileConflict = vi.fn().mockResolvedValue(undefined);
	const linkConflict = vi.fn().mockResolvedValue(undefined);
	const insert = vi
		.fn()
		.mockReturnValueOnce({
			values: vi.fn().mockReturnValue({ onConflictDoUpdate: profileConflict })
		})
		.mockReturnValueOnce({
			values: vi.fn().mockReturnValue({ onConflictDoNothing: linkConflict })
		});
	const where = vi.fn().mockResolvedValue(student ? [student] : []);
	const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	const db = {
		select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where }) }),
		insert,
		update: vi.fn().mockReturnValue({ set })
	};

	return {
		input: {
			url: new URL("http://localhost/register/parent"),
			request: new Request("http://localhost/register/parent", {
				method: "POST",
				body: new URLSearchParams({
					phone: "555-0100",
					educationLevel: "College",
					degree: "Engineering",
					jobTitle: "Engineer",
					studentEmail: " Student@School.edu "
				})
			}),
			locals: { user: { id: "parent-1", username: "parent@example.com", role: "user" }, db }
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		insert,
		set
	};
}

describe("parent registration", () => {
	it("links a signed-in parent account to the student matching the school email", async () => {
		const { input, insert, set } = event({
			userid: "student@school.edu",
			firstName: "Alex",
			lastName: "Student"
		});

		await expect(actions.default(input)).rejects.toMatchObject({
			status: 303,
			location: "/dashboard/parent"
		});
		expect(insert).toHaveBeenCalledTimes(2);
		expect(insert.mock.calls[1]).toBeDefined();
		expect(set).toHaveBeenCalledWith({ role: "parent" });
	});

	it("does not create a link when the student email is not registered", async () => {
		const { input, insert } = event(null);

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: {
				message:
					"No student found with that email address. Please make sure your student has registered first."
			}
		});
		expect(insert).not.toHaveBeenCalled();
	});
});
