import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const loginMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("login account creation warning", () => {
	it("warns users that an unrecognized email creates a new account", () => {
		expect(loginMarkup).toContain('class="alert alert-warning py-2" role="note"');
		expect(loginMarkup).toContain(
			"Double-check your email address. If it does not match an existing account, we will"
		);
		expect(loginMarkup).toContain("create a new account using it.");
	});
});
