import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("event forms list layout", () => {
	it("provides a link to create a form", () => {
		expect(pageMarkup).toContain("resolve(`/admin/events/${data.event.id}/forms/new`)");
		expect(pageMarkup).toContain("Create New Form");
	});

	it("renders each form with field counts and view/edit links", () => {
		expect(pageMarkup).toContain("{#each data.forms as savedForm (savedForm.id)}");
		expect(pageMarkup).toContain("{savedForm.name}");
		expect(pageMarkup).toContain(
			"{(savedForm.definition as { fields: unknown[] }).fields.length} fields"
		);
		expect(pageMarkup).toContain(
			"resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}/base`)"
		);
		expect(pageMarkup).toContain(
			"resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}/edit`)"
		);
		expect(pageMarkup).toContain(">View</a");
		expect(pageMarkup).toContain(">Edit</a");
	});

	it("keeps the empty state and removes the embedded creator", () => {
		expect(pageMarkup).toContain("No forms added yet.");
		expect(pageMarkup).not.toContain('id="base-pdf"');
		expect(pageMarkup).not.toContain("PdfFormDesigner");
		expect(pageMarkup).not.toContain('action="?/save"');
	});
});
