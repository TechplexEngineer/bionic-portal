import { fail, redirect } from "@sveltejs/kit";
import { eq, and, or, isNull, notInArray } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import * as qb from "$lib/server/quickbooks";
import type { DbInstance } from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const db = event.locals.db;
	const eventId = event.params.id;

	const [eventData] = await db.select().from(table.events).where(eq(table.events.id, eventId));

	if (!eventData) {
		return redirect(302, "/admin/events");
	}

	const registrations = await db
		.select({
			id: table.eventRegistrations.id,
			paid: table.eventRegistrations.paid,
			formCompleted: table.eventRegistrations.formCompleted,
			invoiceId: table.eventRegistrations.invoiceId,
			invoicePaymentLink: table.eventRegistrations.invoicePaymentLink,
			student: {
				userid: table.students.userid,
				firstName: table.students.firstName,
				lastName: table.students.lastName,
				dietaryRestrictions: table.students.dietaryRestrictions,
				intoleranceLevel: table.students.intoleranceLevel
			}
		})
		.from(table.eventRegistrations)
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.where(eq(table.eventRegistrations.eventId, eventId));
	const forms = await db
		.select()
		.from(table.eventForms)
		.where(eq(table.eventForms.eventId, eventId));
	const submissions = await db
		.select({
			registrationId: table.eventFormSubmissions.registrationId,
			eventFormId: table.eventFormSubmissions.eventFormId,
			signedPdfKey: table.eventFormSubmissions.signedPdfKey
		})
		.from(table.eventFormSubmissions)
		.innerJoin(table.eventForms, eq(table.eventFormSubmissions.eventFormId, table.eventForms.id))
		.where(eq(table.eventForms.eventId, eventId));
	const submissionKeys = new Set(
		submissions
			.filter((submission) => Boolean(submission.signedPdfKey))
			.map((submission) => `${submission.registrationId}:${submission.eventFormId}`)
	);
	const formsByRegistration = Object.fromEntries(
		registrations.map((registration) => [
			registration.id,
			forms.map((eventForm) => ({
				id: eventForm.id,
				name: eventForm.name,
				completed: submissionKeys.has(`${registration.id}:${eventForm.id}`)
			}))
		])
	);

	const totals = {
		registered: registrations.length,
		paid: registrations.filter((r) => r.paid).length,
		formsCompleted: registrations.filter((r) =>
			forms.length
				? forms.every((eventForm) => submissionKeys.has(`${r.id}:${eventForm.id}`))
				: r.formCompleted
		).length,
		eventReady: registrations.filter(
			(r) =>
				r.paid &&
				(forms.length
					? forms.every((eventForm) => submissionKeys.has(`${r.id}:${eventForm.id}`))
					: r.formCompleted)
		).length
	};

	const registeredStudentIds = registrations.map((r) => r.student.userid);

	let unregisteredStudents = [];
	if (registeredStudentIds.length > 0) {
		unregisteredStudents = await db
			.select({
				userid: table.students.userid,
				firstName: table.students.firstName,
				lastName: table.students.lastName
			})
			.from(table.students)
			.where(
				and(
					notInArray(table.students.userid, registeredStudentIds),
					eq(table.students.hidden, false)
				)
			)
			.orderBy(table.students.lastName, table.students.firstName);
	} else {
		unregisteredStudents = await db
			.select({
				userid: table.students.userid,
				firstName: table.students.firstName,
				lastName: table.students.lastName
			})
			.from(table.students)
			.where(eq(table.students.hidden, false))
			.orderBy(table.students.lastName, table.students.firstName);
	}

	return {
		event: { id: eventData.id, ...eventData.data },
		registrations,
		totals,
		unregisteredStudents,
		forms,
		formsByRegistration,
		registrationClosed: Boolean(
			eventData.data.registrationDueDate &&
			new Date(eventData.data.registrationDueDate) < new Date()
		)
	};
};

async function createAndSaveInvoice(
	db: DbInstance,
	regId: string,
	studentEmail: string,
	studentName: string,
	eventName: string,
	cost: string | number
) {
	// 1. Find or create customer
	let qbCustomer =
		(await qb.findCustomerByEmail(db, studentEmail)) ||
		(await qb.findCustomerByName(db, studentName));

	if (!qbCustomer) {
		const createRes = await qb.createCustomer(db, studentName, studentEmail);
		qbCustomer = createRes.Customer;
	}

	// 2. Find or create item (event)
	let qbItem = await qb.findItemByName(db, eventName);
	if (!qbItem) {
		// Find income account first as per GS reference
		const incomeAccountName = "Program Service Revenue (L2):District Events Income";
		const incomeAccount = await qb.findIncomeAccountByName(db, incomeAccountName);
		if (!incomeAccount) {
			throw new Error(
				`Income account not found in QuickBooks. Please create it first: '${incomeAccountName}'`
			);
		}

		const createRes = await qb.createItem(db, eventName, "Competition Fee", incomeAccount.Id);
		qbItem = createRes.Item;
	}

	// 3. Create invoice
	const invoiceItems = [
		{
			Amount: cost.toString(),
			DetailType: "SalesItemLineDetail",
			SalesItemLineDetail: {
				ItemRef: { value: qbItem.Id }
			},
			Description: "Competition Fee"
		}
	];

	const qbInvoiceRes = await qb.createInvoice(db, qbCustomer.Id, invoiceItems);
	const invoiceId = qbInvoiceRes.Invoice.DocNumber;
	const qbId = qbInvoiceRes.Invoice.Id;

	// 4. Fetch the payment link
	const fullInvoice = await qb.getInvoice(db, qbId);
	const invoicePaymentLink = fullInvoice?.InvoiceLink;

	await db
		.update(table.eventRegistrations)
		.set({ invoiceId, invoicePaymentLink })
		.where(eq(table.eventRegistrations.id, regId));

	return { invoiceId, invoicePaymentLink };
}

export const actions: Actions = {
	togglePaid: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const paid = formData.get("paid") === "true";

		const db = locals.db;
		await db
			.update(table.eventRegistrations)
			.set({ paid: !paid })
			.where(eq(table.eventRegistrations.id, id));

		return { success: true };
	},
	toggleForm: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const formCompleted = formData.get("formCompleted") === "true";

		const db = locals.db;
		await db
			.update(table.eventRegistrations)
			.set({ formCompleted: !formCompleted })
			.where(eq(table.eventRegistrations.id, id));

		return { success: true };
	},
	createInvoice: async (event) => {
		const { request, locals, cookies, params } = event;
		const formData = await request.formData();
		const id = formData.get("id") as string;
		const studentEmail = formData.get("studentEmail") as string;

		const db = locals.db;

		// Fetch student and event data
		const [reg] = await db
			.select({
				student: table.students,
				event: table.events
			})
			.from(table.eventRegistrations)
			.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
			.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
			.where(eq(table.eventRegistrations.id, id));

		if (!reg) return fail(404, { message: "Registration not found" });

		const studentName = `${reg.student.firstName} ${reg.student.lastName}`;
		const eventName = reg.event.data.name;
		const cost = reg.event.data.cost;

		try {
			const { invoiceId, invoicePaymentLink } = await createAndSaveInvoice(
				db,
				id,
				studentEmail,
				studentName,
				eventName,
				cost
			);
			return { success: true, invoiceId, invoicePaymentLink };
		} catch (error: any) {
			if (error.message === "AUTH_REQUIRED") {
				cookies.set("qb_return_url", event.url.pathname + event.url.search, { path: "/" });
				throw redirect(302, await qb.getAuthorizationUrl());
			}
			console.error("QuickBooks Error:", error);
			return fail(500, { message: error.message });
		}
	},
	createAllInvoices: async (event) => {
		const { locals, cookies, params } = event;
		const eventId = params.id;
		const db = locals.db;

		// Fetch all registrations for this event missing an invoice
		const missingInvoices = await db
			.select({
				id: table.eventRegistrations.id,
				studentEmail: table.students.userid,
				firstName: table.students.firstName,
				lastName: table.students.lastName,
				eventName: table.events.data,
				cost: table.events.data
			})
			.from(table.eventRegistrations)
			.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
			.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
			.where(
				and(
					eq(table.eventRegistrations.eventId, eventId),
					or(eq(table.eventRegistrations.invoiceId, ""), isNull(table.eventRegistrations.invoiceId))
				)
			);

		let createdCount = 0;
		try {
			for (const reg of missingInvoices) {
				const studentName = `${reg.firstName} ${reg.lastName}`;
				const eventData = reg.eventName as any;
				await createAndSaveInvoice(
					db,
					reg.id,
					reg.studentEmail,
					studentName,
					eventData.name,
					eventData.cost
				);
				createdCount++;
			}
			return { success: true, createdCount };
		} catch (error: any) {
			if (error.message === "AUTH_REQUIRED") {
				cookies.set("qb_return_url", event.url.pathname + event.url.search, { path: "/" });
				throw redirect(302, await qb.getAuthorizationUrl());
			}
			console.error("QuickBooks Error during bulk creation:", error);
			return fail(500, {
				message: `Created ${createdCount} invoices before error: ${error.message}`
			});
		}
	},
	manualRegister: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const studentId = formData.get("studentId") as string;
		const eventId = params.id;
		const db = locals.db;

		if (!studentId) {
			return fail(400, { message: "Student selection is required" });
		}

		const [student] = await db
			.select()
			.from(table.students)
			.where(eq(table.students.userid, studentId));
		if (!student) return fail(404, { message: "Student not found" });
		const [existing] = await db
			.select()
			.from(table.eventRegistrations)
			.where(
				and(
					eq(table.eventRegistrations.eventId, eventId),
					eq(table.eventRegistrations.studentId, studentId)
				)
			);
		if (existing)
			return fail(400, { message: "This student is already registered for the event." });
		try {
			await db.insert(table.eventRegistrations).values({
				id: crypto.randomUUID(),
				studentId,
				eventId,
				paid: false,
				formCompleted: false
			});
			return { success: true };
		} catch (error: any) {
			console.error("Manual Registration Error:", error);
			return fail(500, { message: "Failed to register student manually." });
		}
	}
};
