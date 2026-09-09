import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { exportFlattenedPdf, validateDefinition } from "bionic-sign";
import { getOwnedFields } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const [row] = await locals.db
		.select({
			form: table.eventForms,
			submission: table.eventFormSubmissions,
			invite: table.parentFormInvites
		})
		.from(table.parentFormInvites)
		.innerJoin(
			table.eventFormSubmissions,
			eq(table.parentFormInvites.submissionId, table.eventFormSubmissions.id)
		)
		.innerJoin(table.eventForms, eq(table.eventFormSubmissions.eventFormId, table.eventForms.id))
		.where(eq(table.parentFormInvites.id, params.inviteId));
	if (!row || row.invite.email !== locals.user!.username.toLowerCase())
		throw error(404, "Form not found");
	const object = await platform?.env.FORMS_BUCKET.get(row.form.basePdfKey);
	if (!object) throw error(404, "Base PDF not found");
	const definition = validateDefinition(row.form.definition);
	const studentDefinition = { version: 1 as const, fields: getOwnedFields(definition, "student") };
	const values = (row.submission.studentValues ?? {}) as Record<string, never>;
	const pdf = await exportFlattenedPdf(
		new Uint8Array(await object.arrayBuffer()),
		studentDefinition,
		values
	);
	return new Response(pdf as unknown as BodyInit, {
		headers: { "content-type": "application/pdf", "cache-control": "private, no-store" }
	});
};
