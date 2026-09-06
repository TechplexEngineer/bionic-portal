import { describe, expect, it } from "vitest";
import { sortEventsByStartDate } from "$lib/server/eventSorting";

describe("sortEventsByStartDate", () => {
	it("returns events from soonest to latest without mutating the input", () => {
		const events = [
			{ name: "Later event", dateStr: "2026-06-15T09:00:00Z" },
			{ name: "Soonest event", dateStr: "2026-04-15T09:00:00Z" },
			{ name: "Middle event", dateStr: "2026-05-15T09:00:00Z" }
		];

		expect(sortEventsByStartDate(events, (event) => event.dateStr).map((event) => event.name)).toEqual([
			"Soonest event",
			"Middle event",
			"Later event"
		]);
		expect(events[0].name).toBe("Later event");
	});
});
