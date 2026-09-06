import { describe, expect, it } from "vitest";
import { ATTENDANCE_SEASON_START, ATTENDANCE_SEASON_START_TIMESTAMP } from "./attendance";

describe("attendance season boundary", () => {
	it("starts inclusively on July 31, 2026", () => {
		expect(ATTENDANCE_SEASON_START).toBe("2026-07-31");
		expect(new Date("2026-07-30T23:59:59.999Z").getTime()).toBeLessThan(
			ATTENDANCE_SEASON_START_TIMESTAMP.getTime()
		);
		expect(new Date("2026-07-31T00:00:00.000Z").getTime()).toBe(
			ATTENDANCE_SEASON_START_TIMESTAMP.getTime()
		);
		expect(new Date("2026-08-01T00:00:00.000Z").getTime()).toBeGreaterThan(
			ATTENDANCE_SEASON_START_TIMESTAMP.getTime()
		);
	});
});
