import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { getLoginUrl } from "$lib/server/authRedirect";
import type { Actions, PageServerLoad } from "./$types";

const shirtSizes = ["YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"];
const firstAlumniOptions = ["yes", "no"];

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, getLoginUrl(event.url));
	}

	const [profile] = await event.locals.db
		.select()
		.from(table.mentorProfiles)
		.where(eq(table.mentorProfiles.userId, event.locals.user.id));

	return { profile: profile ?? null, email: event.locals.user.username };
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: "Unauthorized" });
		}

		const formData = await event.request.formData();
		const firstName = formData.get("firstName")?.toString().trim() ?? "";
		const lastName = formData.get("lastName")?.toString().trim() ?? "";
		const phone = formData.get("phone")?.toString().trim() ?? "";
		const company = formData.get("company")?.toString().trim() ?? "";
		const tshirtSize = formData.get("tshirtSize")?.toString() ?? "";
		const firstAlumni = formData.get("firstAlumni")?.toString() ?? "";

		if (!firstName || !lastName || !phone || !company) {
			return fail(400, { message: "Please complete all required mentor fields." });
		}
		if (!shirtSizes.includes(tshirtSize)) {
			return fail(400, { message: "Please select a valid shirt size." });
		}
		if (!firstAlumniOptions.includes(firstAlumni)) {
			return fail(400, { message: "Please tell us whether you are a FIRST alumnus." });
		}

		try {
			await event.locals.db
				.insert(table.mentorProfiles)
				.values({
					userId: event.locals.user.id,
					firstName,
					lastName,
					phone,
					company,
					tshirtSize,
					firstAlumni
				})
				.onConflictDoUpdate({
					target: table.mentorProfiles.userId,
					set: {
						firstName,
						lastName,
						phone,
						company,
						tshirtSize,
						firstAlumni
					}
				});

			if (event.locals.user.role === "user") {
				await event.locals.db
					.update(table.user)
					.set({ role: "mentor" })
					.where(eq(table.user.id, event.locals.user.id));
			}

			return { success: true, message: "Mentor profile saved successfully!" };
		} catch (error) {
			console.error("Failed to save mentor profile:", error);
			return fail(500, { message: "An error occurred while saving your mentor profile." });
		}
	}
};
