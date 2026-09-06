export interface ShopDraft {
	location: string;
	item: string;
}

export interface ShopLocationLike extends ShopDraft {
	id: string;
}

export function createShopDrafts(locations: ShopLocationLike[]): Record<string, ShopDraft> {
	return Object.fromEntries(locations.map(({ id, location, item }) => [id, { location, item }]));
}

export function getDirtyShopLocationIds(
	locations: ShopLocationLike[],
	drafts: Record<string, ShopDraft>
): string[] {
	return locations
		.filter((location) => {
			const draft = drafts[location.id];
			return draft && (draft.location !== location.location || draft.item !== location.item);
		})
		.map((location) => location.id);
}
