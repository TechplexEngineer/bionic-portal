import { describe, expect, it } from "vitest";
import { getSafeReturnTo } from "./returnTo";

describe("getSafeReturnTo", () => {
	it("uses the internal return path from the URL", () => {
		expect(
			getSafeReturnTo(new URL("http://localhost/register?returnTo=%2Fdashboard%2Fparent"))
		).toBe("/dashboard/parent");
	});

	it("rejects external return URLs", () => {
		expect(
			getSafeReturnTo(new URL("http://localhost/register?returnTo=https%3A%2F%2Fevil.example"))
		).toBe("/dashboard");
	});
});
