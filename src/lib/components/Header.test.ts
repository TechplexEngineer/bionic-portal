import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const headerMarkup = readFileSync(resolve(import.meta.dirname, "Header.svelte"), "utf8");

describe("Header user menu", () => {
	it("right-aligns the dropdown so it stays within the viewport", () => {
		expect(headerMarkup).toMatch(/class="dropdown-menu dropdown-menu-end text-small"/);
	});
});
