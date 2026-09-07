import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";
import * as auth from "$lib/server/auth";

describe("logout route", () => {
	it("invalidates the active session, clears the cookie, and redirects to login", async () => {
		const invalidateSession = vi.spyOn(auth, "invalidateSession").mockResolvedValue();
		const deleteSessionTokenCookie = vi
			.spyOn(auth, "deleteSessionTokenCookie")
			.mockImplementation(() => {});
		const event = {
			locals: { session: { id: "session-id" } },
			platform: { env: {} },
			cookies: {}
		} as unknown as Parameters<NonNullable<typeof actions.default>>[0];

		await expect(load!(event)).rejects.toMatchObject({
			status: 303,
			location: "/login"
		});
		expect(invalidateSession).toHaveBeenCalledWith("session-id", event.platform);
		expect(deleteSessionTokenCookie).toHaveBeenCalledWith(event);
	});
});
