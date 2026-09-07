import { describe, expect, it, vi } from "vitest";
import * as table from "$lib/server/db/schema";
import { actions } from "./+page.server";

const event = (overrides: Partial<table.EventData> = {}): table.Events => ({
	id: "event-1",
	data: {
		name: "Regional Competition",
		startDate: "2026-10-01T09:00:00Z",
		endDate: "2026-10-02T17:00:00Z",
		location: "Boston",
		isOvernight: true,
		departureTime: "08:00",
		returnTime: "18:00",
		cost: 25,
		permissionFormUrl: "https://forms.example.org/permission",
		studentsPerRoom: 4,
		mentorsPerRoom: 2,
		...overrides
	}
});

function registrationAction({
	eventRecord = event(),
	studentRecord = { userid: "student@example.com" },
	existingRegistration = undefined
}: {
	eventRecord?: table.Events;
	studentRecord?: { userid: string } | null;
	existingRegistration?: object;
} = {}) {
	const select = vi
		.fn()
		.mockImplementationOnce(() => ({ from: () => ({ where: async () => [eventRecord] }) }))
		.mockImplementationOnce(() => ({
			from: () => ({ where: async () => (studentRecord ? [studentRecord] : []) })
		}))
		.mockImplementationOnce(() => ({
			from: () => ({ where: async () => (existingRegistration ? [existingRegistration] : []) })
		}));
	const values = vi.fn().mockResolvedValue(undefined);
	const db = {
		select,
		insert: vi.fn(() => ({ values }))
	};

	return {
		input: {
			request: new Request("http://localhost/compete", {
				method: "POST",
				body: new URLSearchParams({ eventId: eventRecord.id })
			}),
			locals: {
				db,
				user: { username: "student@example.com", role: "user" }
			}
		} as unknown as Parameters<NonNullable<typeof actions.register>>[0],
		db,
		values
	};
}

describe("event registration", () => {
	it("registers a student and creates both pending action items when required", async () => {
		const { input, values } = registrationAction();

		expect(await actions.register(input)).toEqual({ success: true });
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				eventId: "event-1",
				studentId: "student@example.com",
				paid: false,
				formCompleted: false
			})
		);
	});

	it("does not create action items for free events without a permission form", async () => {
		const { input, values } = registrationAction({
			eventRecord: event({ cost: 0, permissionFormUrl: undefined })
		});

		expect(await actions.register(input)).toEqual({ success: true });
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({ paid: true, formCompleted: true })
		);
	});

	it("explains that a profile is required instead of leaving the registration form stuck", async () => {
		const { input, db } = registrationAction({ studentRecord: null });

		expect(await actions.register(input)).toMatchObject({
			status: 400,
			data: { message: "Please complete your student profile before registering for an event" }
		});
		expect(db.insert).not.toHaveBeenCalled();
	});
});
