import { fail } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

const shopLocationForm = z.object({
	location: z.string().trim().min(1, "Location is required").max(100),
	item: z.string().trim().min(1, "Item is required").max(255)
});

function readLocationForm(formData: FormData) {
	const result = shopLocationForm.safeParse({
		location: formData.get("location"),
		item: formData.get("item")
	});

	if (!result.success) {
		return { error: result.error.issues[0]?.message ?? "Invalid shop location" };
	}

	return { value: result.data };
}

export const load = (async ({ locals }) => {
	const locations = await locals.db
		.select()
		.from(table.shopLocations)
		.orderBy(asc(table.shopLocations.location));
	return { locations };
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const parsed = readLocationForm(await request.formData());
		if ("error" in parsed) return fail(400, { message: parsed.error });

		try {
			await locals.db.insert(table.shopLocations).values({
				id: crypto.randomUUID(),
				...parsed.value
			});
		} catch (error) {
			console.error("Failed to create shop location", error);
			return fail(400, { message: "That location already exists or could not be saved." });
		}

		return { success: "Shop location added." };
	},
	update: async ({ locals, request }) => {
		const formData = await request.formData();
		const id = formData.get("id");
		const parsed = readLocationForm(formData);
		if (typeof id !== "string" || !id) {
			return fail(400, { message: "Invalid shop location ID" });
		}
		if ("error" in parsed) return fail(400, { message: parsed.error });

		try {
			await locals.db
				.update(table.shopLocations)
				.set(parsed.value)
				.where(eq(table.shopLocations.id, id));
		} catch (error) {
			console.error("Failed to update shop location", error);
			return fail(400, { message: "That location already exists or could not be saved." });
		}

		return { success: "Shop location updated." };
	},
	delete: async ({ locals, request }) => {
		const id = (await request.formData()).get("id");
		if (typeof id !== "string" || !id) return fail(400, { message: "Invalid shop location ID" });

		await locals.db.delete(table.shopLocations).where(eq(table.shopLocations.id, id));
		return { success: "Shop location removed." };
	}
};
