import { redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session && event.platform) {
			await auth.invalidateSession(event.locals.session.id, event.platform);
		}
		auth.deleteSessionTokenCookie(event);
		redirect(303, "/login");
	}
};
