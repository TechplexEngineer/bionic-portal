import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { ROLES } from "$lib/roles";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals, params }) => {
	const currentUser = await locals.db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, params.userid)
	});

	if (!currentUser) {
		return redirect(302, "/admin/users");
	}

	return { currentUser, roles: ROLES };
}) satisfies PageServerLoad;

export const actions: Actions = {
	edit: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const email = formData.get("username");
		const username = typeof email === "string" ? email.trim().toLowerCase() : "";
		const role = formData.get("role");

		if (username.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
			return fail(400, { message: "Enter a valid email address" });
		}

		if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) {
			return fail(400, { message: "Invalid role" });
		}

		const updateData: Partial<typeof table.user.$inferInsert> = { username, role };

		try {
			await locals.db.update(table.user).set(updateData).where(eq(table.user.id, params.userid));
		} catch {
			return fail(500, { message: "Failed to update user" });
		}

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (locals.user?.id === params.userid) {
			return fail(400, { message: "You cannot delete your own account" });
		}
		await locals.db.delete(table.user).where(eq(table.user.id, params.userid));
		return redirect(302, "/admin/users");
	}
};
