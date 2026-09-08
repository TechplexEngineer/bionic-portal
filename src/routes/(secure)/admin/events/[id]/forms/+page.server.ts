import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw redirect(302, "/admin/events");
	const forms = await locals.db
		.select()
		.from(table.eventForms)
		.where(eq(table.eventForms.eventId, params.id));
	return { event: { id: event.id, ...event.data }, forms };
};
