const redirectOrigin = "https://bionic-portal.invalid";
const fallbackPath = "/dashboard";

export function getSafeReturnPath(value: string | null | undefined): string {
	if (!value) return fallbackPath;

	try {
		const url = new URL(value, redirectOrigin);
		if (url.origin !== redirectOrigin) return fallbackPath;
		return `${url.pathname}${url.search}`;
	} catch {
		return fallbackPath;
	}
}

export function getLoginUrl(url: URL): string {
	const next = getSafeReturnPath(`${url.pathname}${url.search}`);
	return `/login?next=${encodeURIComponent(next)}`;
}
