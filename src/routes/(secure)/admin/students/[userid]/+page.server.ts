import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { getStudentFields, type StudentField } from "$lib/server/studentFields";
import type { Actions, PageServerLoad } from "./$types";

const parseStudentValue = (field: StudentField, formData: FormData) => {
	if (field.inputType === "checkbox") return formData.get(field.key) === "on";

	const rawValue = formData.get(field.key);
	const value = typeof rawValue === "string" ? rawValue : "";
	if (field.inputType === "number") {
		if (!value.trim()) return null;
		const numberValue = Number(value);
		return Number.isFinite(numberValue) ? numberValue : undefined;
	}

	return value.trim() ? value : null;
};

export const load = (async ({ locals, params }) => {
	const student = await locals.db.query.students.findFirst({
		where: (students, { eq }) => eq(students.userid, params.userid)
	});

	if (!student) throw error(404, "Student not found");

	return { student, fields: getStudentFields() };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const fields = getStudentFields();
		const updateData: Record<string, unknown> = {};

		for (const field of fields) {
			const value = parseStudentValue(field, formData);
			if (value === undefined) {
				return fail(400, { message: `${field.label} must be a valid number` });
			}
			if (field.required && value === null) {
				return fail(400, { message: `${field.label} is required` });
			}
			updateData[field.key] = value;
		}

		const newUserid = updateData.userid;
		if (typeof newUserid !== "string" || !newUserid.trim()) {
			return fail(400, { message: "User ID is required" });
		}

		try {
			await locals.db
				.update(table.students)
				.set(updateData as Partial<typeof table.students.$inferInsert>)
				.where(eq(table.students.userid, params.userid));
		} catch (e) {
			console.error("Failed to update student:", e);
			const reason = e instanceof Error ? e.message : "Unknown database error";
			return fail(500, { message: `Failed to update student: ${reason}` });
		}

		throw redirect(303, `/admin/students/${encodeURIComponent(newUserid)}`);
	}
};
