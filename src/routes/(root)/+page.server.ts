import type { PageServerLoad } from "./$types";
import { sortEventsByStartDate } from "$lib/server/eventSorting";

export const load = (async ({ locals }) => {
	const eventResult = await locals.db.query.events.findMany();
	const events = sortEventsByStartDate(
		eventResult.map((e) => ({
			name: e.data.name,
			dateStr: e.data.startDate
		})),
		(event) => event.dateStr
	);

	return {
		events
	};
}) satisfies PageServerLoad;
