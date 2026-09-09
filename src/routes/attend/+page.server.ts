import type { Actions, PageServerLoad } from "./$types";
import { attendance, shopLocations } from "$lib/server/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";
import { sortEventsByStartDate } from "$lib/server/eventSorting";

export const load = (async ({ locals }) => {
	// get a list of students that have checked in within the last 6 hours
	const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
	const membersResult = await locals.db.query.students.findMany({
		with: {
			attendance: {
				where: (attendance, { gte }) => gte(attendance.timestamp, sixHoursAgo)
			}
		}
	});
	const lastYear = String(new Date().getFullYear() - 1);

	const members = membersResult
		.filter((m) => !m.hidden && m.graduationYear !== lastYear)
		.map((m) => ({
			id: m.userid,
			name: `${m.firstName} ${m.lastName}`,
			here: m.attendance.length > 0
		}));

	const eventResult = await locals.db.query.events.findMany();
	const locations = await locals.db
		.select()
		.from(shopLocations)
		.orderBy(asc(shopLocations.location));
	const dbEvents = eventResult.map((e) => ({
		name: e.data.name,
		dateStr: e.data.startDate
	}));

	return {
		events: sortEventsByStartDate(dbEvents, (event) => event.dateStr),
		locations,
		membersNotHere: members.filter((m) => !m.here).sort((a, b) => a.name.localeCompare(b.name)),
		membersHere: members.filter((m) => m.here).sort((a, b) => a.name.localeCompare(b.name))
	};
}) satisfies PageServerLoad;

export const actions = {
	checkin: async ({ request, locals }) => {
		const data = await request.formData();
		const studentID = data.get("userid");
		console.log(`Checkin for ${studentID}`);

		if (typeof studentID !== "string") {
			return { success: false, error: "Invalid student ID" };
		}

		// check if the student exists
		const student = await locals.db.query.students.findFirst({
			where: (students, { eq }) => eq(students.userid, studentID)
		});

		if (!student) {
			return { success: false, error: "Student not found" };
		}

		// check if the student is already checked in
		// Check for attendance records within the last 6 hours instead of start/end of day
		const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

		const attendanceRecords = await locals.db.query.attendance.findFirst({
			where: (attendance, { eq, gte, and }) =>
				and(eq(attendance.userid, studentID), gte(attendance.timestamp, sixHoursAgo))
		});

		if (attendanceRecords) {
			return { success: false, error: "Student already checked in" };
		}

		// insert a new attendance record
		await locals.db.insert(attendance).values({
			userid: studentID,
			timestamp: new Date()
		});

		return { success: true };
	},
	uncheckin: async ({ request, locals }) => {
		const data = await request.formData();
		const studentID = data.get("userid");

		if (typeof studentID !== "string") {
			return { success: false, error: "Invalid student ID" };
		}

		const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
		const attendanceRecord = await locals.db.query.attendance.findFirst({
			where: (attendance, { eq, gte, and }) =>
				and(eq(attendance.userid, studentID), gte(attendance.timestamp, sixHoursAgo))
		});

		if (!attendanceRecord) {
			return { success: false, error: "Student is not checked in" };
		}

		await locals.db
			.delete(attendance)
			.where(and(eq(attendance.userid, studentID), gte(attendance.timestamp, sixHoursAgo)));

		return { success: true, action: "uncheckin" };
	}
} satisfies Actions;
