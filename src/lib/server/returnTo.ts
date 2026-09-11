export function getSafeReturnTo(url: URL, fallback = "/dashboard") {
	const returnTo = url.searchParams.get("returnTo");
	return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
}
