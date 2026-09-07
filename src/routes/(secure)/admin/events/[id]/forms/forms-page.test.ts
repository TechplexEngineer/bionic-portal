import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("event form creator layout", () => {
	it("keeps PDF setup above a full-width Bionic Sign designer", () => {
		const setup = pageMarkup.indexOf('id="base-pdf"');
		const designer = pageMarkup.indexOf('class="bionic-sign w-100"');

		expect(setup).toBeGreaterThan(-1);
		expect(designer).toBeGreaterThan(setup);
		expect(pageMarkup).toContain('class="col-12"');
		expect(pageMarkup).not.toContain('class="col-lg-8"');
	});
});
