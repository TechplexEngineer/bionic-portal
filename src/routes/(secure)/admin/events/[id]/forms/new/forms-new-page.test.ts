import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { actions } from "./+page.server";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

function actionInput(formData: FormData, db = createDb()) {
	return {
		request: new Request("http://localhost/admin/events/event-1/forms/new", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		platform: {
			env: { FORMS_BUCKET: createBucket() }
		},
		params: { id: "event-1" }
	} as unknown as Parameters<typeof actions.default>[0];
}

function createDb() {
	const insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));
	const select = vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue([{ id: "event-1" }])
		}))
	}));
	return { insert, select };
}

function createBucket() {
	return { put: vi.fn().mockResolvedValue(undefined) };
}

describe("new event form action", () => {
	it("rejects a missing name or PDF without writing", async () => {
		const db = createDb();
		const result = await actions.default(actionInput(new FormData(), db));

		expect(result).toMatchObject({
			status: 400,
			data: { message: "A form name and PDF are required." }
		});
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("rejects a non-PDF upload", async () => {
		const formData = new FormData();
		formData.set("name", "Permission Form");
		formData.set("pdf", new File(["not a pdf"], "form.txt", { type: "text/plain" }));

		const result = await actions.default(actionInput(formData));

		expect(result).toMatchObject({
			status: 400,
			data: { message: "The base document must be a PDF." }
		});
	});

	it("uploads and creates an empty form before redirecting to its editor", async () => {
		const formData = new FormData();
		formData.set("name", " Permission Form ");
		const pdf = new File(["%PDF-1.7"], "blank.pdf", { type: "application/pdf" });
		formData.set("pdf", pdf);
		const db = createDb();
		const bucket = createBucket();
		const input = actionInput(formData, db);
		(input.platform as unknown as { env: { FORMS_BUCKET: typeof bucket } }).env.FORMS_BUCKET =
			bucket;

		await expect(actions.default(input)).rejects.toMatchObject({
			status: 303,
			location: expect.stringMatching(/^\/admin\/events\/event-1\/forms\/[^/]+\/edit$/)
		});
		expect(bucket.put).toHaveBeenCalledWith(
			expect.stringMatching(/^events\/event-1\/forms\/[^/]+\/base\.pdf$/),
			expect.any(ArrayBuffer),
			expect.objectContaining({ httpMetadata: { contentType: "application/pdf" } })
		);
		const values = (db.insert.mock.results[0]?.value as { values: ReturnType<typeof vi.fn> })
			.values;
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				eventId: "event-1",
				name: "Permission Form",
				definition: { version: 1, fields: [] }
			})
		);
	});
});

describe("new event form page", () => {
	it("contains only name and blank PDF setup controls", () => {
		expect(pageMarkup).toContain('name="name"');
		expect(pageMarkup).toContain('name="pdf"');
		expect(pageMarkup).toContain('enctype="multipart/form-data"');
		expect(pageMarkup).toContain("Upload blank PDF");
		expect(pageMarkup).not.toContain("PdfFormDesigner");
		expect(pageMarkup).not.toContain('name="definition"');
	});
});
