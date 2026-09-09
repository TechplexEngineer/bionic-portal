import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { exportFlattenedPdf, validateDefinition } from "bionic-sign";
import { consumeParentFormInvite } from "$lib/server/parentInvites";
import { getOwnedFields, validateOwnedValues } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

async function getInvite(db: App.Locals["db"], id: string) {
	const [row] = await db
		.select({
			invite: table.parentFormInvites,
			submission: table.eventFormSubmissions,
			form: table.eventForms,
			registration: table.eventRegistrations,
			event: table.events,
			student: table.students
		})
		.from(table.parentFormInvites)
		.innerJoin(
			table.eventFormSubmissions,
			eq(table.parentFormInvites.submissionId, table.eventFormSubmissions.id)
		)
		.innerJoin(table.eventForms, eq(table.eventFormSubmissions.eventFormId, table.eventForms.id))
		.innerJoin(
			table.eventRegistrations,
			eq(table.eventFormSubmissions.registrationId, table.eventRegistrations.id)
		)
		.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.where(eq(table.parentFormInvites.id, id));
	return row;
}

async function authorize(
	db: App.Locals["db"],
	user: App.Locals["user"],
	inviteId: string,
	token: unknown
) {
	const row = await getInvite(db, inviteId);
	if (!row || row.invite.email !== user!.username.toLowerCase()) return null;
	if (!row.invite.consumedAt) {
		const consumed = await consumeParentFormInvite(db, inviteId, token);
		if (!consumed) return null;
		await db
			.insert(table.parentStudentLinks)
			.values({ parentId: user!.id, studentId: row.student.userid })
			.onConflictDoNothing();
		if (user!.role === "user")
			await db.update(table.user).set({ role: "parent" }).where(eq(table.user.id, user!.id));
	}
	return row;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const row = await authorize(
		locals.db,
		locals.user!,
		params.inviteId,
		url.searchParams.get("token")
	);
	if (!row) throw redirect(302, "/dashboard/parent");
	const definition = validateDefinition(row.form.definition);
	return {
		inviteId: params.inviteId,
		definition: { version: 1 as const, fields: getOwnedFields(definition, "parent") },
		student: row.student,
		event: { id: row.event.id, ...row.event.data },
		form: row.form
	};
};

export const actions: Actions = {
	submit: async ({ request, locals, params, platform, url }) => {
		const row = await authorize(
			locals.db,
			locals.user!,
			params.inviteId,
			url.searchParams.get("token")
		);
		if (!row) return error(404, "Invitation not found or expired");
		try {
			const definition = validateDefinition(row.form.definition);
			const values = validateOwnedValues(
				definition,
				JSON.parse((await request.formData()).get("values")?.toString() ?? "{}"),
				"parent"
			);
			const combined = { ...((row.submission.studentValues ?? {}) as object), ...values };
			const object = await platform?.env.FORMS_BUCKET.get(row.form.basePdfKey);
			if (!object) return error(404, "Base PDF not found");
			const pdf = await exportFlattenedPdf(
				new Uint8Array(await object.arrayBuffer()),
				definition,
				combined
			);
			const signedPdfKey = `events/${row.event.id}/forms/${row.form.id}/signed/${row.registration.id}.pdf`;
			await platform?.env.FORMS_BUCKET.put(signedPdfKey, pdf, {
				httpMetadata: { contentType: "application/pdf" }
			});
			await locals.db
				.update(table.eventFormSubmissions)
				.set({
					parentValues: values,
					parentCompleted: true,
					parentCompletedAt: new Date(),
					signedPdfKey,
					values: combined
				})
				.where(eq(table.eventFormSubmissions.id, row.submission.id));
			return { success: true };
		} catch (submissionError) {
			console.error(
				"Failed to save parent form signature:",
				submissionError instanceof Error ? submissionError.message : "unknown error"
			);
			return { status: 400, message: "Please complete all required parent fields." };
		}
	}
};
