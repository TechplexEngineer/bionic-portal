import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { DbInstance } from "./db";
import {
	consumeMagicLink,
	hashMagicLinkToken,
	issueMagicLink,
	MAGIC_LINK_TTL_MS,
	revokeMagicLink
} from "./magicLinks";

const Database = createRequire(import.meta.url)("better-sqlite3");

describe("magic-link storage", () => {
	let sqlite: ReturnType<typeof Database>;
	let db: DbInstance;
	const now = new Date("2026-09-05T12:00:00Z");
	beforeEach(() => {
		sqlite = new Database(":memory:");
		sqlite.exec(
			"CREATE TABLE magic_codes (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at INTEGER NOT NULL)"
		);
		db = drizzle(sqlite) as unknown as DbInstance;
	});
	afterEach(() => sqlite.close());

	it("stores only a digest and consumes the token once", async () => {
		const token = await issueMagicLink(db, "test@example.org", now);
		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
		const stored = sqlite.prepare("SELECT * FROM magic_codes").get();
		expect(stored.code).toBe(hashMagicLinkToken(token!));
		expect(stored.code).not.toBe(token);
		expect(stored.expires_at).toBe(now.getTime() + MAGIC_LINK_TTL_MS);
		expect(await consumeMagicLink(db, token, now)).toBe("test@example.org");
		expect(await consumeMagicLink(db, token, now)).toBeNull();
	});

	it("rejects expired, malformed, old numeric and incorrect tokens", async () => {
		const token = await issueMagicLink(db, "test@example.org", now);
		for (const invalid of [null, "123456", "a".repeat(43), "<script>"]) {
			expect(await consumeMagicLink(db, invalid, now)).toBeNull();
		}
		expect(
			await consumeMagicLink(db, token, new Date(now.getTime() + MAGIC_LINK_TTL_MS))
		).toBeNull();
	});

	it("atomically enforces cooldown and invalidates replaced links", async () => {
		const token = await issueMagicLink(db, "test@example.org", now);
		expect(
			await issueMagicLink(db, "test@example.org", new Date(now.getTime() + 59999))
		).toBeNull();
		const replacement = await issueMagicLink(
			db,
			"test@example.org",
			new Date(now.getTime() + 60000)
		);
		expect(replacement).toBeTruthy();
		expect(replacement).not.toBe(token);
		expect(await consumeMagicLink(db, token, now)).toBeNull();
		expect(await consumeMagicLink(db, replacement, now)).toBe("test@example.org");
	});

	it("revokes delivery failures without deleting newer links", async () => {
		const token = await issueMagicLink(db, "test@example.org", now);
		const replacement = await issueMagicLink(
			db,
			"test@example.org",
			new Date(now.getTime() + 60000)
		);
		await revokeMagicLink(db, token!);
		expect(await consumeMagicLink(db, replacement, now)).toBe("test@example.org");
		const failed = await issueMagicLink(db, "test@example.org", now);
		await revokeMagicLink(db, failed!);
		expect(await consumeMagicLink(db, failed, now)).toBeNull();
	});
});
