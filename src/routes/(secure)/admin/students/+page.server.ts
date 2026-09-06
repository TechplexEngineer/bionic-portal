import { fail } from "@sveltejs/kit";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals, url }) => {
	const db = locals.db;
	const showArchived = url.searchParams.get("showArchived") === "true";
	const lastYear = String(new Date().getFullYear() - 1);

	// Fetch students and count of registered parents for each
	const studentsWithParents = await db
		.select({
			userid: table.students.userid,
			firstName: table.students.firstName,
			lastName: table.students.lastName,
			graduationYear: table.students.graduationYear,
			dietaryRestrictions: table.students.dietaryRestrictions,
			parentNames: table.students.parentNames,
			parentEmails: table.students.parentEmails,
			phone: table.students.phone,
			parentPhone: table.students.parentPhone,
			customFields: table.students.customFields,
			hidden: table.students.hidden,
			parentCount: sql<number>`count(${table.parentStudentLinks.parentId})`,
			attendanceCount: sql<number>`(
            select count(*) from attendance
            where attendance.userid = ${table.students.userid}
        )`,
			registrationCount: sql<number>`(
            select count(*) from event_registrations
            where event_registrations.student_id = ${table.students.userid}
        )`,
			roomAssignmentCount: sql<number>`(
            select count(*) from room_assignments
            where room_assignments.student_id = ${table.students.userid}
        )`,
			carpoolAssignmentCount: sql<number>`(
            select count(*) from carpool_assignments
            where carpool_assignments.student_id = ${table.students.userid}
        )`
		})
		.from(table.students)
		.leftJoin(
			table.parentStudentLinks,
			eq(table.students.userid, table.parentStudentLinks.studentId)
		)
		.groupBy(table.students.userid)
		.where(
			showArchived
				? undefined
				: and(
						eq(table.students.hidden, false),
						or(
							isNull(table.students.graduationYear),
							eq(table.students.graduationYear, ""),
							ne(table.students.graduationYear, lastYear)
						)
					)
		);

	return {
		students: studentsWithParents,
		showArchived
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	delete: async ({ locals, request }) => {
		if (locals.user?.role !== "admin") {
			return fail(403, { message: "Admin access required" });
		}

		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string" || id.trim() === "") {
			return fail(400, { message: "Invalid student ID" });
		}

		await locals.db
			.delete(table.parentStudentLinks)
			.where(eq(table.parentStudentLinks.studentId, id));
		await locals.db.delete(table.attendance).where(eq(table.attendance.userid, id));
		await locals.db
			.delete(table.eventRegistrations)
			.where(eq(table.eventRegistrations.studentId, id));
		await locals.db.delete(table.roomAssignments).where(eq(table.roomAssignments.studentId, id));
		await locals.db
			.delete(table.carpoolAssignments)
			.where(eq(table.carpoolAssignments.studentId, id));
		await locals.db.delete(table.students).where(eq(table.students.userid, id));

		return { success: true };
	},

	toggleHidden: async ({ locals, request }) => {
		if (locals.user?.role !== "admin") {
			return fail(403, { message: "Admin access required" });
		}

		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string" || id.trim() === "") {
			return fail(400, { message: "Invalid student ID" });
		}

		await locals.db
			.update(table.students)
			.set({ hidden: sql`not ${table.students.hidden}` })
			.where(eq(table.students.userid, id));

		return { success: true };
	}
};
