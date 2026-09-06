export function sortEventsByStartDate<T>(events: T[], getStartDate: (event: T) => string): T[] {
	return [...events].sort(
		(a, b) => Date.parse(getStartDate(a)) - Date.parse(getStartDate(b))
	);
}
