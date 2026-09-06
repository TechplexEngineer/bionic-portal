import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { actions } from "./+page.server";
import { actions as verification, load } from "./verify/+page.server";
import { issueMagicLink } from "$lib/server/magicLinks";
import type { DbInstance } from "$lib/server/db";

vi.mock("$env/dynamic/private", () => ({ env: {} }));
vi.mock("$lib/server/brevo", () => ({ sendMagicLink: vi.fn() }));
import { sendMagicLink } from "$lib/server/brevo";
const Database = createRequire(import.meta.url)("better-sqlite3");

describe("magic-link routes", () => {
	let sqlite: ReturnType<typeof Database>;
	let db: DbInstance;
	beforeEach(() => {
		vi.resetAllMocks();
		sqlite = new Database(":memory:");
		sqlite.exec(`CREATE TABLE magic_codes (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at INTEGER NOT NULL);
		CREATE TABLE user (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL);
		CREATE TABLE session (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);`);
		db = drizzle(sqlite) as unknown as DbInstance;
	});
	afterEach(() => sqlite.close());
	function event(fields: Record<string, string>, key: string | undefined = "test-key") {
		return {
			request: new Request("https://portal.example.org/login", {
				method: "POST",
				body: new URLSearchParams(fields)
			}),
			url: new URL("https://portal.example.org/login"),
			locals: { db, user: null },
			platform: { env: { BREVO_API_KEY: key } },
			cookies: { set: vi.fn() },
			setHeaders: vi.fn()
		} as unknown as Parameters<NonNullable<typeof actions.requestLink>>[0];
	}
	function verificationEvent(fields: Record<string, string>) {
		const input = event(fields);
		input.url = new URL("https://portal.example.org/login/verify");
		return input as unknown as Parameters<NonNullable<typeof verification.default>>[0];
	}
	it("uses platform credentials and normalizes email", async () => {
		const result = await actions.requestLink!(event({ email: " Person@Example.org " }));
		expect(result).toMatchObject({ success: true, email: "person@example.org" });
		expect(sendMagicLink).toHaveBeenCalledWith(
			"person@example.org",
			expect.stringMatching(
				/^https:\/\/portal.example.org\/login\/verify\?token=[A-Za-z0-9_-]{43}$/
			),
			"test-key"
		);
	});
	it("rejects malformed email and repeated requests without sending another email", async () => {
		expect(await actions.requestLink!(event({ email: "bad address@example.org" }))).toMatchObject({
			status: 400
		});
		expect(sendMagicLink).not.toHaveBeenCalled();
		await actions.requestLink!(event({ email: "person@example.org" }));
		expect(await actions.requestLink!(event({ email: "person@example.org" }))).toMatchObject({
			status: 429
		});
		expect(sendMagicLink).toHaveBeenCalledTimes(1);
	});
	it("fails closed without credentials and clears undelivered tokens", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const missing = event({ email: "person@example.org" });
		delete missing.platform!.env.BREVO_API_KEY;
		expect(await actions.requestLink!(missing)).toMatchObject({ status: 503 });
		expect(errorSpy).toHaveBeenCalledWith(
			"[auth] BREVO_API_KEY is not configured; cannot send magic link"
		);
		expect(sqlite.prepare("SELECT count(*) AS count FROM magic_codes").get().count).toBe(0);
		vi.mocked(sendMagicLink).mockRejectedValue(new Error("delivery failed"));
		expect(await actions.requestLink!(event({ email: "person@example.org" }))).toMatchObject({
			status: 503
		});
		expect(sqlite.prepare("SELECT count(*) AS count FROM magic_codes").get().count).toBe(0);
	});
	it("does not consume on GET and preserves existing admin role on POST", async () => {
		sqlite
			.prepare("INSERT INTO user VALUES (?, ?, ?, ?)")
			.run("admin-id", "Person@Example.org", "existing", "admin");
		const token = await issueMagicLink(db, "person@example.org");
		const input = verificationEvent({ token: token! });
		input.url.searchParams.set("token", token!);
		expect(await load(input as unknown as Parameters<typeof load>[0])).toEqual({ token });
		expect(sqlite.prepare("SELECT count(*) AS count FROM magic_codes").get().count).toBe(1);
		await expect(verification.default!(input)).rejects.toMatchObject({
			status: 303,
			location: "/dashboard"
		});
		expect(input.cookies.set).toHaveBeenCalled();
		expect(sqlite.prepare("SELECT role FROM user").get().role).toBe("admin");
		expect(sqlite.prepare("SELECT user_id FROM session").get().user_id).toBe("admin-id");
		expect(await verification.default!(verificationEvent({ token: token! }))).toMatchObject({
			status: 400
		});
	});
	it("rejects ambiguous legacy usernames without creating a session", async () => {
		sqlite
			.prepare("INSERT INTO user VALUES (?, ?, ?, ?)")
			.run("one", "Person@Example.org", "existing", "admin");
		sqlite
			.prepare("INSERT INTO user VALUES (?, ?, ?, ?)")
			.run("two", "person@example.org", "existing", "user");
		const token = await issueMagicLink(db, "person@example.org");
		expect(await verification.default!(verificationEvent({ token: token! }))).toMatchObject({
			status: 400
		});
		expect(sqlite.prepare("SELECT count(*) AS count FROM session").get().count).toBe(0);
	});
	it("creates a new user with the ordinary user role", async () => {
		const token = await issueMagicLink(db, "new@example.org");
		await expect(verification.default!(verificationEvent({ token: token! }))).rejects.toMatchObject(
			{
				status: 303
			}
		);
		expect(sqlite.prepare("SELECT username, role FROM user").get()).toEqual({
			username: "new@example.org",
			role: "user"
		});
	});
});
