import { encodeBase32LowerCase } from "@oslojs/encoding";
import { fail, redirect } from "@sveltejs/kit";
import * as table from "$lib/server/db/schema";
import { ROLES } from "$lib/roles";
import type { Actions, PageServerLoad } from "./$types";

export const load = (() => {
	return { roles: ROLES };
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = await request.formData();
		const email = formData.get("username");
		const username = typeof email === "string" ? email.trim().toLowerCase() : "";
		const role = formData.get("role");

		if (username.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
			return fail(400, { message: "Enter a valid email address", username: "" });
		}

		if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) {
			return fail(400, { message: "Invalid role", username: username as string });
		}

		const userId = generateUserId();
		const passwordHash = "MAGIC_LINK_ONLY";

		try {
			await locals.db.insert(table.user).values({ id: userId, username, passwordHash, role });
		} catch {
			return fail(500, {
				message: "Email already exists or an error occurred",
				username: username as string
			});
		}

		return redirect(302, "/admin/users");
	}
};

function generateUserId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}
