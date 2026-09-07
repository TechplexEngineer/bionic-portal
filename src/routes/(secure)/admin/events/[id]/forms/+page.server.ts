import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw redirect(302, "/admin/events");
	const forms = await locals.db
		.select()
		.from(table.eventForms)
		.where(eq(table.eventForms.eventId, params.id));
	return { event: { id: event.id, ...event.data }, forms };
};

export const actions: Actions = {
	save: async ({ request, locals, platform, params }) => {
		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const definitionText = formData.get("definition")?.toString();
		const pdf = formData.get("pdf");
		if (!name || !definitionText || !(pdf instanceof File) || pdf.size === 0) {
			return fail(400, { message: "A form name, PDF, and field definition are required." });
		}
		if (pdf.type && pdf.type !== "application/pdf") {
			return fail(400, { message: "The base document must be a PDF." });
		}
		let definition: unknown;
		try {
			definition = JSON.parse(definitionText);
		} catch {
			return fail(400, { message: "The field definition is not valid JSON." });
		}
		if (
			!definition ||
			typeof definition !== "object" ||
			(definition as { version?: number }).version !== 1
		) {
			return fail(400, {
				message: "The form definition must be a version 1 Bionic Sign definition."
			});
		}

		const event = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
		if (!event.length) return fail(404, { message: "Event not found" });
		const formId = crypto.randomUUID();
		const pdfKey = `events/${params.id}/forms/${formId}/base.pdf`;
		try {
			const bucket = platform?.env.FORMS_BUCKET;
			if (!bucket) throw new Error("Forms storage is not configured");
			await bucket.put(pdfKey, await pdf.arrayBuffer(), {
				httpMetadata: { contentType: "application/pdf" }
			});
			await locals.db.insert(table.eventForms).values({
				id: formId,
				eventId: params.id,
				name,
				basePdfKey: pdfKey,
				definition
			});
		} catch (error) {
			console.error("Failed to save event form:", error);
			return fail(500, { message: "Unable to save the form." });
		}
		return { success: true };
	}
};
