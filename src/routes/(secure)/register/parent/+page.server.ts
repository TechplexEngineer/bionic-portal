import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { getSafeReturnTo } from "$lib/server/returnTo";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string) {
	return email.length <= 254 && emailPattern.test(email);
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login");
	}

	const db = event.locals.db;
	const userId = event.locals.user.id;

	// Check if the user already has a parent profile
	const [profile] = await db
		.select()
		.from(table.parentProfiles)
		.where(eq(table.parentProfiles.userId, userId));

	// Get linked students with names
	const links = await db
		.select()
		.from(table.parentStudentLinks)
		.where(eq(table.parentStudentLinks.parentId, userId));

	const linkedStudents = await Promise.all(
		links.map(async (link) => {
			const [student] = await db
				.select()
				.from(table.students)
				.where(eq(table.students.userid, link.studentId));
			return student ?? { userid: link.studentId, firstName: "", lastName: "" };
		})
	);
	const pendingStudentLinks = await db
		.select()
		.from(table.pendingParentStudentLinks)
		.where(eq(table.pendingParentStudentLinks.parentId, userId));

	return {
		user: event.locals.user,
		profile: profile ?? null,
		hasProfile: !!profile,
		linkedStudents,
		pendingStudentLinks
	};
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: "Unauthorized" });
		}

		const formData = await event.request.formData();
		const studentEmails = formData
			.getAll("studentEmail")
			.map((value) => (value as string).toLowerCase().trim())
			.filter(Boolean);
		const phone = (formData.get("phone") as string)?.trim();
		const educationLevel = (formData.get("educationLevel") as string)?.trim();
		const degree = (formData.get("degree") as string)?.trim();
		const jobTitle = (formData.get("jobTitle") as string)?.trim();

		if (studentEmails.some((email) => !isValidEmail(email))) {
			return fail(400, { message: "Enter a valid student email address." });
		}

		if (!phone || !educationLevel || !degree || !jobTitle) {
			return fail(400, { message: "Please complete all required parent profile fields." });
		}

		const db = event.locals.db;
		const userId = event.locals.user.id;

		// 1. Find every submitted student before changing the parent's profile.
		const students = await Promise.all(
			[...new Set(studentEmails)].map(async (studentEmail) => {
				const [student] = await db
					.select()
					.from(table.students)
					.where(eq(table.students.userid, studentEmail));
				return { email: studentEmail, student };
			})
		);

		try {
			// 2. Save or update the complete parent profile.
			await db
				.insert(table.parentProfiles)
				.values({ userId, phone, educationLevel, degree, jobTitle })
				.onConflictDoUpdate({
					target: table.parentProfiles.userId,
					set: { phone, educationLevel, degree, jobTitle }
				});

			// 3. Link registered students and save the rest for automatic linking later.
			for (const { email, student } of students) {
				if (student) {
					await db
						.insert(table.parentStudentLinks)
						.values({ parentId: userId, studentId: student.userid })
						.onConflictDoNothing();
				} else {
					await db
						.insert(table.pendingParentStudentLinks)
						.values({ parentId: userId, studentEmail: email })
						.onConflictDoNothing();
				}
			}

			// 4. Update user role to 'parent' if it's currently 'user'
			if (event.locals.user.role === "user") {
				await db.update(table.user).set({ role: "parent" }).where(eq(table.user.id, userId));
			}
		} catch (e) {
			console.error("Failed to connect parent to student:", e);
			return fail(500, { message: "An error occurred while connecting to the student." });
		}

		throw redirect(303, getSafeReturnTo(event.url, "/dashboard/parent"));
	},
	removePendingStudent: async (event) => {
		if (!event.locals.user) return fail(401, { message: "Unauthorized" });

		const formData = await event.request.formData();
		const rawEmail = formData.get("studentEmail");
		const studentEmail = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";
		if (!isValidEmail(studentEmail)) {
			return fail(400, { message: "Enter a valid student email address." });
		}

		await event.locals.db
			.delete(table.pendingParentStudentLinks)
			.where(
				and(
					eq(table.pendingParentStudentLinks.parentId, event.locals.user.id),
					eq(table.pendingParentStudentLinks.studentEmail, studentEmail)
				)
			);
		return { success: true };
	}
};
