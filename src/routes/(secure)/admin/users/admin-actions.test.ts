import { describe, expect, it, vi } from "vitest";
import { actions as createActions } from "./new/+page.server";
import { actions as editActions } from "./[userid]/+page.server";
import { actions as shopActions } from "../shop/+page.server";

function event(fields: Record<string, string>) {
	const values = vi.fn().mockResolvedValue(undefined);
	const where = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn().mockReturnValue({ where });
	const db = {
		insert: vi.fn().mockReturnValue({ values }),
		update: vi.fn().mockReturnValue({ set })
	};
	return {
		input: {
			request: new Request("http://localhost/admin/users", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			locals: { db },
			params: { userid: "existing-user" }
		} as unknown as Parameters<typeof createActions.create>[0] &
			Parameters<typeof editActions.edit>[0],
		db,
		values,
		set,
		where
	};
}

describe("admin email-only accounts", () => {
	it("creates a normalized email account with the requested role and no password", async () => {
		const { input, values } = event({ username: "  Member@Example.COM  ", role: "mentor" });
		await expect(createActions.create(input)).rejects.toMatchObject({
			status: 302,
			location: "/admin/users"
		});
		expect(values).toHaveBeenCalledWith({
			id: expect.any(String),
			username: "member@example.com",
			role: "mentor",
			passwordHash: "MAGIC_LINK_ONLY"
		});
	});

	it("edits email and role without overwriting the existing password hash", async () => {
		const { input, set, where } = event({
			username: "  Updated@Example.COM  ",
			role: "parent",
			password: "stale-client-password"
		});
		await expect(editActions.edit(input)).resolves.toEqual({ success: true });
		expect(set).toHaveBeenCalledWith({ username: "updated@example.com", role: "parent" });
		expect(where).toHaveBeenCalledOnce();
	});

	for (const [name, action] of [
		["create", createActions.create],
		["edit", editActions.edit]
	] as const) {
		it.each([
			undefined,
			"",
			"username",
			"a@@example.com",
			"a b@example.com",
			`${"a".repeat(243)}@example.com`
		])(`${name} rejects missing or invalid email %s without writing`, async (username) => {
			const fields: Record<string, string> = { role: "user" };
			if (username !== undefined) fields.username = username;
			const { input, db } = event(fields);
			await expect(action(input)).resolves.toMatchObject({
				status: 400,
				data: { message: "Enter a valid email address" }
			});
			expect(db.insert).not.toHaveBeenCalled();
			expect(db.update).not.toHaveBeenCalled();
		});

		it(`${name} rejects an unsupported role without writing`, async () => {
			const { input, db } = event({ username: "member@example.com", role: "superuser" });
			await expect(action(input)).resolves.toMatchObject({
				status: 400,
				data: { message: "Invalid role" }
			});
			expect(db.insert).not.toHaveBeenCalled();
			expect(db.update).not.toHaveBeenCalled();
		});
	}
});

describe("shop location bulk updates", () => {
	it("updates every submitted location", async () => {
		const updates = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where: updates });
		const db = { update: vi.fn().mockReturnValue({ set }) };
		const input = {
			request: new Request("http://localhost/admin/shop", {
				method: "POST",
				body: new URLSearchParams({
					locations: JSON.stringify([
						{ id: "one", location: "W1-B", item: "Updated Motors" },
						{ id: "two", location: "W2-B", item: "Updated Tape" }
					])
				})
			}),
			locals: { db }
		} as unknown as Parameters<typeof shopActions.updateAll>[0];

		expect(await shopActions.updateAll(input)).toEqual({ success: "Shop locations saved." });
		expect(set).toHaveBeenCalledTimes(2);
		expect(updates).toHaveBeenCalledTimes(2);
	});

	it("rejects malformed bulk updates without writing", async () => {
		const db = { update: vi.fn() };
		const input = {
			request: new Request("http://localhost/admin/shop", {
				method: "POST",
				body: new URLSearchParams({
					locations: JSON.stringify([{ id: "one", location: "", item: "Tape" }])
				})
			}),
			locals: { db }
		} as unknown as Parameters<typeof shopActions.updateAll>[0];

		expect(await shopActions.updateAll(input)).toMatchObject({ status: 400 });
		expect(db.update).not.toHaveBeenCalled();
	});
});
