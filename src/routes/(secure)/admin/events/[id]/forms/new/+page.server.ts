import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw redirect(302, "/admin/events");
	return { event: { id: event.id, ...event.data } };
};

export const actions: Actions = {
	default: async ({ request, locals, platform, params }) => {
		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const pdf = formData.get("pdf");

		if (!name || !(pdf instanceof File) || pdf.size === 0) {
			return fail(400, { message: "A form name and PDF are required." });
		}
		if (pdf.type && pdf.type !== "application/pdf") {
			return fail(400, { message: "The base document must be a PDF." });
		}

		const [event] = await locals.db
			.select()
			.from(table.events)
			.where(eq(table.events.id, params.id));
		if (!event) return fail(404, { message: "Event not found" });

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
				definition: { version: 1, fields: [] }
			});
		} catch (error) {
			console.error("Failed to create event form:", error);
			return fail(500, { message: "Unable to create the form." });
		}

		throw redirect(303, `/admin/events/${params.id}/forms/${formId}/edit`);
	}
};
