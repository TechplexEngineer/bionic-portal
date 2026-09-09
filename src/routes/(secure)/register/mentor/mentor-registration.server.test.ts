import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

const validFields = {
	firstName: "Alex",
	lastName: "Mentor",
	phone: "555-0100",
	company: "Bionic Labs",
	tshirtSize: "L",
	firstAlumni: "yes"
};

function event(fields: Record<string, string> = validFields) {
	const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
	const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
	const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	const db = {
		select: vi
			.fn()
			.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
		insert: vi.fn().mockReturnValue({ values }),
		update: vi.fn().mockReturnValue({ set })
	};

	return {
		input: {
			request: new Request("http://localhost/register/mentor", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			locals: { user: { id: "user-1", username: "mentor@example.com", role: "user" }, db }
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0],
		values,
		set
	};
}

describe("mentor registration", () => {
	it("preserves the registration URL for unauthenticated users", async () => {
		const input = {
			url: new URL("https://portal.example.org/register/mentor"),
			locals: { user: null }
		} as unknown as Parameters<typeof load>[0];

		await expect(load(input)).rejects.toMatchObject({
			status: 302,
			location: "/login?next=%2Fregister%2Fmentor"
		});
	});

	it("saves registration details and promotes a new user to mentor", async () => {
		const { input, values, set } = event();

		expect(await actions.default(input)).toEqual({
			success: true,
			message: "Mentor profile saved successfully!"
		});
		expect(values).toHaveBeenCalledWith({
			userId: "user-1",
			firstName: "Alex",
			lastName: "Mentor",
			phone: "555-0100",
			company: "Bionic Labs",
			tshirtSize: "L",
			firstAlumni: "yes"
		});
		expect(set).toHaveBeenCalledWith({ role: "mentor" });
	});

	it("rejects incomplete registration fields before writing", async () => {
		const { input, values } = event({ ...validFields, company: "" });

		expect(await actions.default(input)).toMatchObject({
			status: 400,
			data: { message: "Please complete all required mentor fields." }
		});
		expect(values).not.toHaveBeenCalled();
	});
});
