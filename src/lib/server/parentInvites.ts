import { and, eq, gt, isNull } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import type { DbInstance } from "./db";
import { parentFormInvites } from "./db/schema";

export const PARENT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeInviteEmail(email: string) {
	return email.trim().toLowerCase();
}

export function isInviteToken(value: unknown): value is string {
	return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashInviteToken(token: string) {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export function createInviteToken() {
	return encodeBase64url(crypto.getRandomValues(new Uint8Array(32))).replace(/=+$/, "");
}

export async function issueParentFormInvite(
	db: DbInstance,
	submissionId: string,
	email: string,
	now = new Date()
) {
	const token = createInviteToken();
	const [invite] = await db
		.insert(parentFormInvites)
		.values({
			id: crypto.randomUUID(),
			submissionId,
			email: normalizeInviteEmail(email),
			code: hashInviteToken(token),
			expiresAt: new Date(now.getTime() + PARENT_INVITE_TTL_MS)
		})
		.returning({ id: parentFormInvites.id });
	return invite ? { id: invite.id, token } : null;
}

export async function consumeParentFormInvite(
	db: DbInstance,
	inviteId: string,
	token: unknown,
	now = new Date()
) {
	if (!isInviteToken(token)) return null;
	const [invite] = await db
		.select()
		.from(parentFormInvites)
		.where(
			and(
				eq(parentFormInvites.id, inviteId),
				eq(parentFormInvites.code, hashInviteToken(token)),
				gt(parentFormInvites.expiresAt, now),
				isNull(parentFormInvites.consumedAt)
			)
		);
	if (!invite) return null;
	await db
		.update(parentFormInvites)
		.set({ consumedAt: now })
		.where(eq(parentFormInvites.id, invite.id));
	return invite;
}
