import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { actions, load } from "./[formId]/edit/+page.server";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "[formId]/edit/+page.svelte"), "utf8");

function createDb(
	form = {
		id: "form-1",
		eventId: "event-1",
		name: "Permission Form",
		basePdfKey: "events/event-1/forms/form-1/base.pdf",
		definition: { version: 1, fields: [] }
	}
) {
	const update = vi.fn(() => ({
		set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
	}));
	const select = vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue([form])
		}))
	}));
	return { update, select };
}

function actionInput(formData: FormData, db = createDb()) {
	return {
		request: new Request("http://localhost/admin/events/event-1/forms/form-1/edit", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		params: { id: "event-1", formId: "form-1" }
	} as unknown as Parameters<typeof actions.default>[0];
}

describe("event form editor server", () => {
	it("loads the event and relationship-scoped form", async () => {
		const db = createDb();
		const result = await load({
			locals: { db },
			params: { id: "event-1", formId: "form-1" }
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toMatchObject({
			form: {
				id: "form-1",
				name: "Permission Form",
				definition: { version: 1, fields: [] }
			}
		});
	});

	it("updates only name and definition before redirecting to the forms list", async () => {
		const db = createDb();
		const formData = new FormData();
		formData.set("name", " Updated Form ");
		formData.set("definition", JSON.stringify({ version: 1, fields: [] }));

		await expect(actions.save(actionInput(formData, db))).rejects.toMatchObject({
			status: 303,
			location: "/admin/events/event-1/forms"
		});
		const updateQuery = db.update.mock.results[0]?.value as { set: ReturnType<typeof vi.fn> };
		expect(updateQuery.set).toHaveBeenCalledWith({
			name: "Updated Form",
			definition: { version: 1, fields: [] }
		});
	});
});

describe("event form editor page", () => {
	it("renders the stored form and full-width designer against the local base endpoint", () => {
		expect(pageMarkup).toContain(
			'import { PdfFormDesigner, type FormDefinition } from "bionic-sign"'
		);
		expect(pageMarkup).toContain(
			'source="/admin/events/{data.event.id}/forms/{data.form.id}/base"'
		);
		expect(pageMarkup).toContain("data.form.definition as FormDefinition");
		expect(pageMarkup).toContain('class="w-100"');
		expect(pageMarkup).toContain('name="definition"');
		expect(pageMarkup).toContain('name="name"');
		expect(pageMarkup).toContain('action="?/save"');
	});
});
