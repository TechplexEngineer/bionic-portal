import { sql } from "drizzle-orm";
import { user } from "$lib/server/db/schema";
import type { DbInstance } from "$lib/server/db";

export async function findOrCreateUserByEmail(db: DbInstance, email: string) {
	const matches = await db
		.select()
		.from(user)
		.where(sql`lower(trim(${user.username})) = ${email}`)
		.limit(2);
	if (matches.length > 1) return { user: null, ambiguous: true } as const;

	let [existingUser] = matches;
	if (!existingUser) {
		await db
			.insert(user)
			.values({
				id: crypto.randomUUID(),
				username: email,
				passwordHash: "MAGIC_LINK_ONLY",
				role: "user"
			})
			.onConflictDoNothing({ target: user.username });
		[existingUser] = await db
			.select()
			.from(user)
			.where(sql`lower(trim(${user.username})) = ${email}`);
	}

	return { user: existingUser ?? null, ambiguous: false } as const;
}
