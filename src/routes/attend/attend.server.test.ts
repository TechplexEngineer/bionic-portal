import { describe, expect, it } from "vitest";
import { sortEventsByStartDate } from "$lib/server/eventSorting";
import { load } from "./+page.server";

describe("sortEventsByStartDate", () => {
	it("returns events from soonest to latest without mutating the input", () => {
		const events = [
			{ name: "Later event", dateStr: "2026-06-15T09:00:00Z" },
			{ name: "Soonest event", dateStr: "2026-04-15T09:00:00Z" },
			{ name: "Middle event", dateStr: "2026-05-15T09:00:00Z" }
		];

		expect(
			sortEventsByStartDate(events, (event) => event.dateStr).map((event) => event.name)
		).toEqual(["Soonest event", "Middle event", "Later event"]);
		expect(events[0].name).toBe("Later event");
	});
});

describe("attendance page load", () => {
	it("excludes hidden and graduated students from both attendance lists", async () => {
		const lastYear = String(new Date().getFullYear() - 1);
		const result = await load({
			locals: {
				db: {
					query: {
						students: {
							findMany: async () => [
								{
									userid: "active@example.com",
									firstName: "Active",
									lastName: "Student",
									hidden: false,
									graduationYear: null,
									attendance: []
								},
								{
									userid: "hidden@example.com",
									firstName: "Hidden",
									lastName: "Student",
									hidden: true,
									graduationYear: null,
									attendance: []
								},
								{
									userid: "graduated@example.com",
									firstName: "Graduated",
									lastName: "Student",
									hidden: false,
									graduationYear: lastYear,
									attendance: []
								}
							]
						},
						events: { findMany: async () => [] }
					},
					select: () => ({
						from: () => ({ orderBy: async () => [] })
					})
				}
			} as unknown
		} as Parameters<typeof load>[0]);

		expect(result.membersNotHere).toEqual([
			{ id: "active@example.com", name: "Active Student", here: false }
		]);
		expect(result.membersHere).toEqual([]);
	});
});
