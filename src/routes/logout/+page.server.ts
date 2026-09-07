import { redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

async function logout(event: Parameters<NonNullable<Actions["default"]>>[0]) {
	if (event.locals.session && event.platform) {
		await auth.invalidateSession(event.locals.session.id, event.platform);
	}
	auth.deleteSessionTokenCookie(event);
	redirect(303, "/login");
}

export const load: PageServerLoad = logout;

export const actions: Actions = {
	default: logout
};
