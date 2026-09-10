import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "./+page.server";

const landingMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

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

describe("landing page member registration links", () => {
	it("offers parent registration and keeps mentor registration out of the member options row", () => {
		expect(landingMarkup).toContain("New Team Member");
		expect(landingMarkup).toContain("Returning User");
		expect(landingMarkup).toContain("Parent");
		expect(landingMarkup).toContain('href={resolve("/register/parent")}');
		expect(landingMarkup).not.toContain('href="/register/mentor"');
	});
});
