import { redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

type ActionEvent = Parameters<NonNullable<Actions["default"]>>[0];

async function logout(event: ActionEvent) {
	if (event.locals.session && event.platform) {
		await auth.invalidateSession(event.locals.session.id, event.platform);
	}
	auth.deleteSessionTokenCookie(event);
	redirect(303, "/login");
}

export const load: PageServerLoad = (event) => logout(event as ActionEvent);

export const actions: Actions = {
	default: logout
};
