import { error, fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

async function getAuthorizedForm(
	db: App.Locals["db"],
	studentId: string,
	registrationId: string,
	formId: string
) {
	const [row] = await db
		.select({
			registration: table.eventRegistrations,
			form: table.eventForms,
			event: table.events,
			student: table.students,
			submission: table.eventFormSubmissions
		})
		.from(table.eventRegistrations)
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
		.innerJoin(table.eventForms, eq(table.eventForms.eventId, table.events.id))
		.leftJoin(
			table.eventFormSubmissions,
			and(
				eq(table.eventFormSubmissions.registrationId, table.eventRegistrations.id),
				eq(table.eventFormSubmissions.eventFormId, table.eventForms.id)
			)
		)
		.where(
			and(
				eq(table.eventRegistrations.id, registrationId),
				eq(table.eventRegistrations.studentId, studentId),
				eq(table.eventForms.id, formId)
			)
		);
	return row;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const row = await getAuthorizedForm(
		locals.db,
		locals.user!.username,
		params.registrationId,
		params.formId
	);
	if (!row) throw redirect(302, "/dashboard");
	return {
		form: row.form,
		registrationId: params.registrationId,
		formId: params.formId,
		event: { id: row.event.id, ...row.event.data },
		student: row.student,
		completed: Boolean(row.submission)
	};
};

export const actions: Actions = {
	submit: async ({ request, locals, platform, params }) => {
		const row = await getAuthorizedForm(
			locals.db,
			locals.user!.username,
			params.registrationId,
			params.formId
		);
		if (!row) return fail(404, { message: "Form not found" });
		const formData = await request.formData();
		const pdf = formData.get("pdf");
		const valuesText = formData.get("values")?.toString();
		if (!(pdf instanceof File) || pdf.size === 0 || !valuesText)
			return fail(400, { message: "A completed PDF is required." });
		let values: unknown;
		try {
			values = JSON.parse(valuesText);
		} catch {
			return fail(400, { message: "Submitted form values are invalid." });
		}
		const submissionId = row.submission?.id ?? crypto.randomUUID();
		const signedPdfKey =
			row.submission?.signedPdfKey ??
			`events/${row.event.id}/forms/${row.form.id}/signed/${row.registration.id}.pdf`;
		try {
			const bucket = platform?.env.FORMS_BUCKET;
			if (!bucket) throw new Error("Forms storage is not configured");
			await bucket.put(signedPdfKey, await pdf.arrayBuffer(), {
				httpMetadata: { contentType: "application/pdf" }
			});
			await locals.db
				.insert(table.eventFormSubmissions)
				.values({
					id: submissionId,
					registrationId: row.registration.id,
					eventFormId: row.form.id,
					signedPdfKey,
					values
				})
				.onConflictDoUpdate({
					target: [
						table.eventFormSubmissions.registrationId,
						table.eventFormSubmissions.eventFormId
					],
					set: { signedPdfKey, values, completedAt: new Date() }
				});
		} catch (submitError) {
			console.error("Failed to save signed event form:", submitError);
			return fail(500, { message: "Unable to save your completed form." });
		}
		return { success: true };
	}
};
