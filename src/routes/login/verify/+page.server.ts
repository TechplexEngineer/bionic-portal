import { fail, redirect } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { user } from "$lib/server/db/schema";
import { consumeMagicLink, isMagicLinkToken } from "$lib/server/magicLinks";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	const token = event.url.searchParams.get("token");
	return { token: isMagicLinkToken(token) ? token : null };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const db = event.locals.db;
		const email = await consumeMagicLink(db, formData.get("token"));
		if (!email)
			return fail(400, { message: "This sign-in link is invalid or expired. Request a new link." });
		const matches = await db
			.select()
			.from(user)
			.where(sql`lower(trim(${user.username})) = ${email}`)
			.limit(2);
		if (matches.length > 1)
			return fail(400, { message: "Unable to sign in. Please contact your administrator." });
		let [existingUser] = matches;
		if (!existingUser) {
			await db
				.insert(user)
				.values({
					id: crypto.randomUUID(),
					username: email,
					passwordHash: "MAGIC_LINK_ONLY",
					role: "user"
				})
				.onConflictDoNothing({ target: user.username });
			[existingUser] = await db
				.select()
				.from(user)
				.where(sql`lower(trim(${user.username})) = ${email}`);
		}
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id, db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		redirect(303, "/dashboard");
	}
};
