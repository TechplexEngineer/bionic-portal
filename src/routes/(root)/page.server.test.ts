import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

describe("landing page load", () => {
	it("returns events ordered from soonest to latest", async () => {
		const pageLoad = load as (event: unknown) => Promise<{ events: { name: string }[] }>;
		const result = await pageLoad({
			locals: {
				db: {
					query: {
						events: {
							findMany: async () => [
								{ data: { name: "Later event", startDate: "2026-06-15T09:00:00Z" } },
								{ data: { name: "Soonest event", startDate: "2026-04-15T09:00:00Z" } },
								{ data: { name: "Middle event", startDate: "2026-05-15T09:00:00Z" } }
							]
						}
					}
				}
			}
		} as unknown);

		expect(result.events.map((event) => event.name)).toEqual([
			"Soonest event",
			"Middle event",
			"Later event"
		]);
	});
});
