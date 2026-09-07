import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sendMagicLink } from "$lib/server/brevo";
import { issueMagicLink, revokeMagicLink } from "$lib/server/magicLinks";
import { findOrCreateUserByEmail } from "$lib/server/emailAuth";
import * as auth from "$lib/server/auth";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";
import { getSafeReturnPath } from "$lib/server/authRedirect";

export const load: PageServerLoad = async (event) => {
	const next = getSafeReturnPath(event.url.searchParams.get("next"));
	if (event.locals.user) redirect(302, next);
	return { next };
};

export const actions: Actions = {
	devLogin: async (event) => {
		if (!dev) return fail(404, { message: "Not found" });

		const formData = await event.request.formData();
		const rawNext = formData.get("next");
		const next = getSafeReturnPath(typeof rawNext === "string" ? rawNext : null);
		const rawEmail = formData.get("email");
		const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
		if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { message: "Enter a valid email address." });
		}

		const result = await findOrCreateUserByEmail(event.locals.db, email);
		if (result.ambiguous || !result.user) {
			return fail(400, { message: "Unable to sign in. Please contact your administrator." });
		}
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, result.user.id, event.locals.db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		redirect(303, next);
	},
	requestLink: async (event) => {
		const formData = await event.request.formData();
		const rawNext = formData.get("next");
		const next = getSafeReturnPath(typeof rawNext === "string" ? rawNext : null);
		const rawEmail = formData.get("email");
		const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
		if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { message: "Enter a valid email address." });
		}
		const apiKey = event.platform?.env.BREVO_API_KEY || env.BREVO_API_KEY;
		if (!apiKey) {
			console.error("[auth] BREVO_API_KEY is not configured; cannot send magic link");
			return fail(503, {
				message: "Email sign-in is temporarily unavailable. Please try again later."
			});
		}
		let token: string | null = null;
		try {
			token = await issueMagicLink(event.locals.db, email);
			if (!token)
				return fail(429, { message: "Please wait one minute before requesting another link." });
			const url = new URL("/login/verify", event.url.origin);
			url.searchParams.set("token", token);
			url.searchParams.set("next", next);
			await sendMagicLink(email, url.toString(), apiKey);
			return {
				success: true,
				email,
				message: "Sign-in link sent! Check your email. The link expires in 15 minutes."
			};
		} catch {
			if (token) {
				try {
					await revokeMagicLink(event.locals.db, token);
				} catch {
					/* Expiry remains the fallback if cleanup fails. */
				}
			}
			return fail(503, { message: "Unable to send your sign-in link. Please try again later." });
		}
	}
};
