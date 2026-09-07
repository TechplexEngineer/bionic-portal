import type { PageServerLoad, Actions } from "./$types";
import { getDb } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { redirect, fail } from "@sveltejs/kit";

export const load = (async () => {
	return {
		today: new Date().toISOString().split("T")[0]
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const startDate = formData.get("startDate") as string;
		const endDate = formData.get("endDate") as string;
		const location = formData.get("location") as string;
		const isOvernight = formData.get("isOvernight") === "on";
		const departureTime = formData.get("departureTime") as string;
		const returnTime = formData.get("returnTime") as string;
		const description = formData.get("description") as string;
		const hotelAddress = formData.get("hotelAddress") as string;
		const cost = parseFloat(formData.get("cost") as string);
		const registrationDueDate = (formData.get("registrationDueDate") as string) || undefined;

		if (!name || !startDate || !endDate || !location || isNaN(cost)) {
			return fail(400, {
				name,
				startDate,
				endDate,
				location,
				cost,
				registrationDueDate,
				message: "Missing required fields or invalid cost"
			});
		}

		const db = getDb(platform);
		const id = crypto.randomUUID();

		try {
			await db.insert(table.events).values({
				id,
				data: {
					name,
					startDate,
					endDate,
					location,
					isOvernight,
					departureTime,
					returnTime,
					description,
					hotelAddress,
					cost,
					registrationDueDate,
					studentsPerRoom: parseInt(formData.get("studentsPerRoom") as string) || 4,
					mentorsPerRoom: parseInt(formData.get("mentorsPerRoom") as string) || 2
				}
			});
		} catch (e) {
			console.error("Failed to create event:", e);
			return fail(500, { message: "Failed to create event" });
		}

		throw redirect(303, `/admin/events/${id}/forms`);
	}
};
