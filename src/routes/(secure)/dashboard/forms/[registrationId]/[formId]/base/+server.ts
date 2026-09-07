import { error } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const [form] = await locals.db
		.select({ key: table.eventForms.basePdfKey })
		.from(table.eventForms)
		.innerJoin(
			table.eventRegistrations,
			eq(table.eventRegistrations.eventId, table.eventForms.eventId)
		)
		.where(
			and(
				eq(table.eventForms.id, params.formId),
				eq(table.eventRegistrations.id, params.registrationId),
				eq(table.eventRegistrations.studentId, locals.user!.username)
			)
		);
	if (!form) throw error(404, "Form not found");
	const object = await platform?.env.FORMS_BUCKET.get(form.key);
	if (!object) throw error(404, "Base PDF not found");
	return new Response(object.body, {
		headers: { "content-type": "application/pdf", "cache-control": "private, no-store" }
	});
};
