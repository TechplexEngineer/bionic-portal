import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw error(404, "Event not found");
	const rows = await locals.db
		.select({
			studentId: table.eventRegistrations.studentId,
			firstName: table.students.firstName,
			lastName: table.students.lastName,
			formName: table.eventForms.name,
			signedPdfKey: table.eventFormSubmissions.signedPdfKey
		})
		.from(table.eventFormSubmissions)
		.innerJoin(
			table.eventRegistrations,
			eq(table.eventFormSubmissions.registrationId, table.eventRegistrations.id)
		)
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.innerJoin(table.eventForms, eq(table.eventFormSubmissions.eventFormId, table.eventForms.id))
		.where(eq(table.eventRegistrations.eventId, params.id));
	const zip = new JSZip();
	for (const row of rows) {
		const object = await platform?.env.FORMS_BUCKET.get(row.signedPdfKey);
		if (object)
			zip.file(
				`${safe(row.lastName)}-${safe(row.firstName)}/${safe(row.formName)}.pdf`,
				await object.arrayBuffer()
			);
	}
	return new Response(await zip.generateAsync({ type: "arraybuffer" }), {
		headers: {
			"content-type": "application/zip",
			"content-disposition": `attachment; filename="${safe(event.data.name)}-signed-forms.zip"`
		}
	});
};

function safe(value: string) {
	return (
		value
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-|-$/g, "")
			.toLowerCase() || "form"
	);
}
