import { describe, expect, it } from "vitest";
import { createShopDrafts, getDirtyShopLocationIds } from "./shopDrafts";

const locations = [
	{ id: "one", location: "W1-A", item: "Motors" },
	{ id: "two", location: "W2-A", item: "Tape" }
];

describe("shop drafts", () => {
	it("creates drafts from saved locations and detects changed fields", () => {
		const drafts = createShopDrafts(locations);
		drafts.one.item = "Updated Motors";

		expect(getDirtyShopLocationIds(locations, drafts)).toEqual(["one"]);
	});

	it("does not mark an unchanged draft as dirty", () => {
		const drafts = createShopDrafts(locations);

		expect(getDirtyShopLocationIds(locations, drafts)).toEqual([]);
	});
});
