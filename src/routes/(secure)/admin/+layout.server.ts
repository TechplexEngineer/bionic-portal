import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { getLoginUrl } from "$lib/server/authRedirect";
import type { LayoutServerLoad } from "./$types";

function requireLogin(url: URL) {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, getLoginUrl(url));
	}

	// @todo: enforce admin role
	// if (locals.user.role != "admin") {
	// 	return redirect(302, "/login");
	// }

	return locals.user;
}
export const load: LayoutServerLoad = async (request) => {
	const user = requireLogin(request.url);
	return {
		user
	};
};
