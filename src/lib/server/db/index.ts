import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
type DBSchema = typeof schema;

export const getDb = (platform: App.Platform | undefined): DrizzleD1Database<DBSchema> => {
	const db = platform?.env.bionic_portal_db;
	if (!db) {
		throw new Error("D1 Database not found in environment variables");
	}
	return drizzle(db, { schema });
};

export type DbInstance = ReturnType<typeof getDb>;
