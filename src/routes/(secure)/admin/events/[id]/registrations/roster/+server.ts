import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw error(404, "Event not found");
	const rows = await locals.db
		.select({
			firstName: table.students.firstName,
			lastName: table.students.lastName,
			email: table.students.userid,
			paid: table.eventRegistrations.paid,
			registeredAt: table.eventRegistrations.id
		})
		.from(table.eventRegistrations)
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.where(eq(table.eventRegistrations.eventId, params.id))
		.orderBy(table.students.lastName, table.students.firstName);
	const csv = [
		"First Name,Last Name,Email,Paid,Registration ID",
		...rows.map((row) =>
			[row.firstName, row.lastName, row.email, row.paid ? "Yes" : "No", row.registeredAt]
				.map(csvValue)
				.join(",")
		)
	].join("\r\n");
	return new Response(csv, {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": `attachment; filename="${safeFileName(event.data.name)}-roster.csv"`
		}
	});
};

function csvValue(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}
function safeFileName(value: string) {
	return (
		value
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-|-$/g, "")
			.toLowerCase() || "event"
	);
}
