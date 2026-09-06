import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login");
	}

	const db = event.locals.db;
	const [student] = await db
		.select()
		.from(table.students)
		.where(eq(table.students.userid, event.locals.user.username));

	return {
		student: student
			? {
					...student,
					customFields: student.customFields ? JSON.parse(student.customFields) : {}
				}
			: null,
		email: event.locals.user.username
	};
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: "Unauthorized" });
		}

		const formData = await event.request.formData();
		const firstName = formData.get("firstName") as string;
		const lastName = formData.get("lastName") as string;
		const dietaryRestrictions = formData.get("dietaryRestrictions") as string;
		const intoleranceLevel = formData.get("intoleranceLevel") as string;

		const parentNamesArr = formData.getAll("parentNames");
		const parentEmailsArr = formData.getAll("parentEmails");
		const parentPhonesArr = formData.getAll("parentPhones");

		const validParents = parentNamesArr
			.map((name, i) => ({
				name: name.toString().trim(),
				email: parentEmailsArr[i]?.toString().trim() || "",
				phone: parentPhonesArr[i]?.toString().trim() || ""
			}))
			.filter((p) => p.name || p.email || p.phone);

		const parentNames = validParents.map((p) => p.name).join(",");
		const parentEmails = validParents.map((p) => p.email).join(",");
		const parentPhone = validParents.map((p) => p.phone).join(",");

		const graduationYear = formData.get("graduationYear") as string;
		const tshirtSize = formData.get("tshirtSize") as string;
		const currentGrade = formData.get("currentGrade") as string;
		const gender = formData.get("gender") as string;

		// Handle custom fields
		const customFields: Record<string, string> = {};
		for (const [key, value] of formData.entries()) {
			if (key.startsWith("custom_")) {
				customFields[key.replace("custom_", "")] = value as string;
			}
		}

		if (!firstName || !lastName) {
			return fail(400, { message: "First and last name are required" });
		}

		if (!parentEmails || !parentEmails.trim()) {
			return fail(400, { message: "At least one parent email is required" });
		}

		if (!parentPhone || !parentPhone.trim()) {
			return fail(400, { message: "At least one parent phone number is required" });
		}

		if (!graduationYear) {
			return fail(400, { message: "Year of graduation is required" });
		}

		if (!tshirtSize) {
			return fail(400, { message: "T-shirt size is required" });
		}

		if (!intoleranceLevel) {
			return fail(400, { message: "Please indicate your level of dietary intolerance" });
		}

		if (!currentGrade) {
			return fail(400, { message: "Current grade is required" });
		}

		if (!gender) {
			return fail(400, { message: "Gender is required" });
		}

		const db = event.locals.db;
		const email = event.locals.user.username;

		try {
			await db
				.insert(table.students)
				.values({
					userid: email,
					firstName,
					lastName,
					dietaryRestrictions,
					intoleranceLevel,
					parentNames,
					parentEmails,
					parentPhone,
					graduationYear,
					tshirtSize,
					currentGrade,
					gender,
					customFields: JSON.stringify(customFields)
				})
				.onConflictDoUpdate({
					target: table.students.userid,
					set: {
						firstName,
						lastName,
						dietaryRestrictions,
						intoleranceLevel,
						parentNames,
						parentEmails,
						parentPhone,
						graduationYear,
						tshirtSize,
						currentGrade,
						gender,
						customFields: JSON.stringify(customFields)
					}
				});

			return { success: true, message: "Profile updated successfully!" };
		} catch (e) {
			console.error("Failed to update profile:", e);
			return fail(500, { message: "An error occurred while saving your profile." });
		}
	}
};
