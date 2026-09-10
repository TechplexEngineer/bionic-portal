import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import { validateDefinition } from "@team4909/bionic-sign";
import { sendParentFormInvite } from "$lib/server/brevo";
import {
	getAgeOnDate,
	getFormStatus,
	hasRequiredValues,
	validateOwnedValues
} from "$lib/server/formWorkflow";
import { issueParentFormInvite } from "$lib/server/parentInvites";
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

function parseValues(value: FormDataEntryValue | null) {
	if (typeof value !== "string") throw new Error("Submitted form values are invalid.");
	const parsed = JSON.parse(value);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
		throw new Error("Submitted form values are invalid.");
	return parsed;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const row = await getAuthorizedForm(
		locals.db,
		locals.user!.username,
		params.registrationId,
		params.formId
	);
	if (!row) throw redirect(302, "/dashboard");
	const definition = validateDefinition(row.form.definition);
	const studentValues = (row.submission?.studentValues ?? {}) as Record<string, never>;
	const parentValues = (row.submission?.parentValues ?? {}) as Record<string, never>;
	const under18 = getAgeOnDate(row.student.dateOfBirth!, new Date(row.event.data.startDate)) < 18;
	return {
		form: row.form,
		registrationId: params.registrationId,
		formId: params.formId,
		event: { id: row.event.id, ...row.event.data },
		student: row.student,
		definition,
		studentValues,
		status: getFormStatus({ definition, studentValues, parentValues, under18 }),
		parentEmails:
			row.student.parentEmails
				?.split(",")
				.map((email) => email.trim())
				.filter(Boolean) ?? []
	};
};

async function saveStudentDraft(
	request: Request,
	locals: App.Locals,
	registrationId: string,
	formId: string
) {
	const row = await getAuthorizedForm(locals.db, locals.user!.username, registrationId, formId);
	if (!row) return fail(404, { message: "Form not found" });
	try {
		const definition = validateDefinition(row.form.definition);
		const values = validateOwnedValues(
			definition,
			parseValues((await request.formData()).get("values")),
			"student"
		);
		const existing = row.submission;
		const studentValues = { ...((existing?.studentValues ?? {}) as object), ...values };
		const studentCompleted = hasRequiredValues(definition, studentValues, "student");
		if (existing) {
			await locals.db
				.update(table.eventFormSubmissions)
				.set({
					studentValues,
					studentCompleted,
					values: { ...studentValues, ...((existing.parentValues ?? {}) as object) }
				})
				.where(eq(table.eventFormSubmissions.id, existing.id));
		} else {
			await locals.db
				.insert(table.eventFormSubmissions)
				.values({
					id: crypto.randomUUID(),
					registrationId: row.registration.id,
					eventFormId: row.form.id,
					values: studentValues,
					studentValues,
					parentValues: {},
					studentCompleted
				});
		}
		return { success: true, message: "Draft saved." };
	} catch (error) {
		return fail(400, { message: error instanceof Error ? error.message : "Unable to save draft." });
	}
}

export const actions: Actions = {
	saveDraft: ({ request, locals, params }) =>
		saveStudentDraft(request, locals, params.registrationId, params.formId),
	submit: ({ request, locals, params }) =>
		saveStudentDraft(request, locals, params.registrationId, params.formId),
	sendParent: async ({ request, locals, params, url, platform }) => {
		const row = await getAuthorizedForm(
			locals.db,
			locals.user!.username,
			params.registrationId,
			params.formId
		);
		if (!row) return fail(404, { message: "Form not found" });
		const email = (await request.formData()).get("parentEmail")?.toString().trim().toLowerCase();
		const allowed =
			row.student.parentEmails?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
		if (!email || !allowed.includes(email))
			return fail(400, { message: "Select a parent email from your profile." });
		if (!row.submission?.studentCompleted)
			return fail(400, { message: "Save your student portion before inviting a parent." });
		const definition = validateDefinition(row.form.definition);
		if (
			getAgeOnDate(row.student.dateOfBirth!, new Date(row.event.data.startDate)) >= 18 ||
			!definition.fields.some((field) => field.name.startsWith("parent_") && field.required)
		) {
			return fail(400, { message: "This form does not require a parent signature." });
		}
		try {
			const invite = await issueParentFormInvite(locals.db, row.submission.id, email);
			if (!invite) return fail(429, { message: "Please wait before sending another invitation." });
			const inviteUrl = new URL(`/dashboard/parent/forms/${invite.id}`, url.origin);
			inviteUrl.searchParams.set("token", invite.token);
			const apiKey = platform?.env.BREVO_API_KEY || env.BREVO_API_KEY;
			if (!apiKey) throw new Error("BREVO_API_KEY is not configured");
			await sendParentFormInvite(
				email,
				`${row.student.firstName} ${row.student.lastName}`,
				row.event.data.name,
				inviteUrl.toString(),
				apiKey
			);
			return { success: true, message: "Invitation sent to the parent." };
		} catch (error) {
			console.error(
				"Failed to send parent form invitation:",
				error instanceof Error ? error.message : "unknown error"
			);
			return fail(503, { message: "Unable to send the parent invitation. Please try again." });
		}
	}
};
