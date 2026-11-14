import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

function registrationEvent() {
	const values = vi.fn().mockResolvedValue(undefined);
	const insert = vi.fn().mockReturnValue({ values });

	return {
		input: {
			request: new Request("http://localhost/attend/register", {
				method: "POST",
				body: new URLSearchParams({
					firstname: "Alex",
					lastname: "Smith",
					email: "alex.smith@billericak12.com"
				})
			}),
			locals: { db: { insert } }
		} as unknown as Parameters<NonNullable<typeof actions.register>>[0],
		insert
	};
}

describe("kiosk registration navigation", () => {
	it("returns to the attendance page after a successful registration", async () => {
		const { input } = registrationEvent();

		await expect(actions.register(input)).rejects.toMatchObject({
			status: 303,
			location: "/attend"
		});
	});

	it("offers a cancel link back to the attendance page", () => {
		expect(pageMarkup).toMatch(/<a[^>]*href="\/attend"[^>]*>Cancel<\/a>/);
	});
});
