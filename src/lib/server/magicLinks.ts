import { and, eq, gt, lte } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import type { DbInstance } from "./db";
import { magicCodes } from "./db/schema";

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const MAGIC_LINK_COOLDOWN_MS = 60 * 1000;

export function isMagicLinkToken(value: unknown): value is string {
	return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashMagicLinkToken(token: string) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function issueMagicLink(db: DbInstance, email: string, now = new Date()) {
	const token = encodeBase64url(crypto.getRandomValues(new Uint8Array(32))).replace(/=+$/, "");
	const code = hashMagicLinkToken(token);
	const expiresAt = new Date(now.getTime() + MAGIC_LINK_TTL_MS);
	const [issued] = await db
		.insert(magicCodes)
		.values({ email, code, expiresAt })
		.onConflictDoUpdate({
			target: magicCodes.email,
			set: { code, expiresAt },
			setWhere: lte(magicCodes.expiresAt, new Date(expiresAt.getTime() - MAGIC_LINK_COOLDOWN_MS))
		})
		.returning({ email: magicCodes.email });
	return issued ? token : null;
}

export async function revokeMagicLink(db: DbInstance, token: string) {
	await db.delete(magicCodes).where(eq(magicCodes.code, hashMagicLinkToken(token)));
}

export async function consumeMagicLink(db: DbInstance, token: unknown, now = new Date()) {
	if (!isMagicLinkToken(token)) return null;
	const [consumed] = await db
		.delete(magicCodes)
		.where(and(eq(magicCodes.code, hashMagicLinkToken(token)), gt(magicCodes.expiresAt, now)))
		.returning({ email: magicCodes.email });
	return consumed?.email ?? null;
}
