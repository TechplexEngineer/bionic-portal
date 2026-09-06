import type { DbInstance } from "$lib/server/db";
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				bionic_portal_db: D1Database;
				INTERNAL_API_KEY: string;
				BREVO_API_KEY?: string;
				QUICKBOOKS_CLIENT_ID: string;
				QUICKBOOKS_CLIENT_SECRET: string;
				QUICKBOOKS_COMPANY_ID: string;
				QUICKBOOKS_API_BASE: string;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		interface Locals {
			user: import("$lib/server/auth").SessionValidationResult["user"]; //User | null;
			session: import("$lib/server/auth").SessionValidationResult["session"];
			db: DbInstance;
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};
