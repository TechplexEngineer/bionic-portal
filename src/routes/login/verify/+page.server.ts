import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { findOrCreateUserByEmail } from "$lib/server/emailAuth";
import { consumeMagicLink, isMagicLinkToken } from "$lib/server/magicLinks";
import type { Actions, PageServerLoad } from "./$types";
import { getSafeReturnPath } from "$lib/server/authRedirect";

export const load: PageServerLoad = (event) => {
	const token = event.url.searchParams.get("token");
	return {
		token: isMagicLinkToken(token) ? token : null,
		next: getSafeReturnPath(event.url.searchParams.get("next"))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const rawNext = formData.get("next");
		const next = getSafeReturnPath(typeof rawNext === "string" ? rawNext : null);
		const db = event.locals.db;
		const email = await consumeMagicLink(db, formData.get("token"));
		if (!email)
			return fail(400, { message: "This sign-in link is invalid or expired. Request a new link." });
		const result = await findOrCreateUserByEmail(db, email);
		if (result.ambiguous || !result.user)
			return fail(400, { message: "Unable to sign in. Please contact your administrator." });
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, result.user.id, db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		redirect(303, next);
	}
};
