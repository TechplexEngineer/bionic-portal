import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { getDb } from "$lib/server/db";
import { sequence } from "@sveltejs/kit/hooks";

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken, event.locals.db);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

const addDbToLocals: Handle = async ({ event, resolve }) => {
	const isPrerendering = event.url.hostname === "sveltekit-prerender";
	if (isPrerendering) {
		// Don't inject for fallback pre-rendering
		return resolve(event);
	}

	const db = getDb(event.platform);
	event.locals.db = db;
	return resolve(event);
};

const protectMagicLink: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === "/login/verify") {
		event.setHeaders({ "cache-control": "no-store", "referrer-policy": "no-referrer" });
	}
	return resolve(event);
};

export const handle: Handle = sequence(protectMagicLink, addDbToLocals, handleAuth);
