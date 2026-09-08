import { fail, redirect } from "@sveltejs/kit";
import { validateDefinition } from "bionic-sign";
import { and, eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw redirect(302, "/admin/events");

	const [form] = await locals.db
		.select()
		.from(table.eventForms)
		.where(and(eq(table.eventForms.id, params.formId), eq(table.eventForms.eventId, params.id)));
	if (!form) throw redirect(302, `/admin/events/${params.id}/forms`);

	return {
		event: { id: event.id, ...event.data },
		form: { id: form.id, name: form.name, definition: form.definition }
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const definitionValue = formData.get("definition")?.toString();

		if (!name || !definitionValue) {
			return fail(400, { message: "A form name and definition are required." });
		}

		let definition;
		try {
			definition = validateDefinition(JSON.parse(definitionValue));
		} catch {
			return fail(400, { message: "The form definition is invalid." });
		}

		const [form] = await locals.db
			.select({ id: table.eventForms.id })
			.from(table.eventForms)
			.where(and(eq(table.eventForms.id, params.formId), eq(table.eventForms.eventId, params.id)));
		if (!form) return fail(404, { message: "Form not found" });

		await locals.db
			.update(table.eventForms)
			.set({ name, definition })
			.where(and(eq(table.eventForms.id, params.formId), eq(table.eventForms.eventId, params.id)));

		throw redirect(303, `/admin/events/${params.id}/forms`);
	}
};
