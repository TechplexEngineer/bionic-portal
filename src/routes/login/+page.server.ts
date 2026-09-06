import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sendMagicLink } from "$lib/server/brevo";
import { issueMagicLink, revokeMagicLink } from "$lib/server/magicLinks";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(302, "/dashboard");
	return {};
};

export const actions: Actions = {
	requestLink: async (event) => {
		const formData = await event.request.formData();
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
