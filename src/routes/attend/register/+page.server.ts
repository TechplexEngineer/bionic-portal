import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Actions } from "./$types";
import { httpCode } from "$lib/httpcodes";
import { attendance, students } from "$lib/server/db/schema";

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;
export const actions: Actions = {
	register: async ({ request, locals }) => {
		const formData = await request.formData();
		const firstname = formData.get("firstname")?.toString().trim();
		const lastname = formData.get("lastname")?.toString().trim();
		const email = formData.get("email")?.toString().trim();

		// You can add validation or database logic here
		if (!email?.endsWith("@billericak12.com")) {
			return fail(httpCode.badRequest, {
				error: "Email must end with @billericak12.com"
			});
		}
		if (!firstname || !lastname || !email) {
			return fail(httpCode.badRequest, {
				error: "All fields are required"
			});
		}

		console.log(`Registering ${firstname} ${lastname} with email ${email}`);
		const a = await locals.db.insert(students).values({
			userid: email,
			firstName: firstname,
			lastName: lastname
		});

		// add user to checked in list for today
		const b = await locals.db.insert(attendance).values({
			userid: email,
			timestamp: new Date()
		});

		console.log(a, b);


		return redirect(303, "/attend");
	}
};
