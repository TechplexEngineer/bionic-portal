import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutMarkup = readFileSync(resolve(import.meta.dirname, "+layout.server.ts"), "utf8");

describe("admin layout authorization", () => {
	it("redirects authenticated non-admin users away from the admin route tree", () => {
		expect(layoutMarkup).toMatch(/locals\.user\.role !== "admin"/);
		expect(layoutMarkup).toMatch(/redirect\(302, "\/dashboard"\)/);
	});
});
