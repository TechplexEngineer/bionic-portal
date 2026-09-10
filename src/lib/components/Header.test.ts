import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const headerMarkup = readFileSync(resolve(import.meta.dirname, "Header.svelte"), "utf8");

describe("Header user menu", () => {
	it("shows the signed-in user's email address", () => {
		expect(headerMarkup).toMatch(/<span class="dropdown-item-text">\{user\.username\}<\/span>/);
	});

	it("right-aligns the dropdown so it stays within the viewport", () => {
		expect(headerMarkup).toMatch(/class="dropdown-menu dropdown-menu-end text-small"/);
	});
});

describe("Header authenticated navigation", () => {
	it("renders the dashboard link in the main navbar for logged-in users", () => {
		expect(headerMarkup).toMatch(
			/\{#if !!user\}[\s\S]*class="nav-link[^"]*"[\s\S]*href="\/dashboard"/
		);
	});

	it("renders an admin dropdown containing the admin dashboard", () => {
		expect(headerMarkup).toMatch(/user\.role === "admin"/);
		expect(headerMarkup).toMatch(/href="\/admin"[^>]*>Admin Dashboard<\/a>/);
	});

	it("renders Events as a link to the compete page", () => {
		expect(headerMarkup).toMatch(/href="\/compete"[\s\S]*>Events<\/a/);
		expect(headerMarkup).not.toMatch(/href="\/attend"/);
	});
});
