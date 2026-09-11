import { describe, it, expect } from "vitest";
import { parseDate, parseDateTime, parseBoolean } from "./import";

describe("parseDate", () => {
    it("returns empty string for null/undefined/empty values", () => {
        expect(parseDate(null)).toBe("");
        expect(parseDate(undefined)).toBe("");
        expect(parseDate("")).toBe("");
    });

    it("parses an ISO date string", () => {
        expect(parseDate("2026-01-15")).toBe("2026-01-15");
    });

    it("parses a US-formatted date string (M/D/YYYY)", () => {
        expect(parseDate("1/15/2026")).toBe("2026-01-15");
    });

    it("parses a JavaScript Date object", () => {
        const d = new Date(Date.UTC(2026, 0, 15)); // Jan 15, 2026 UTC
        expect(parseDate(d)).toBe("2026-01-15");
    });

    it("converts an Excel serial date number to the correct date", () => {
        // Excel serial 46037 = January 15, 2026
        // 25569 days between Excel epoch (Jan 0 1900) and Unix epoch (Jan 1 1970)
        // (46037 - 25569) * 86400 * 1000 ms = Jan 15, 2026
        expect(parseDate(46037)).toBe("2026-01-15");
    });

    it("does NOT produce a 1970-01-01 date for a realistic Excel serial", () => {
        // Any date in 2026 will have an Excel serial around 45900-46400
        const result = parseDate(46023); // ~Jan 1 2026
        expect(result).not.toBe("1970-01-01");
        expect(result.startsWith("2026")).toBe(true);
    });

    it("returns empty string for an invalid date string", () => {
        expect(parseDate("not-a-date")).toBe("");
    });
});

describe("parseDateTime", () => {
    it("returns empty string for null/undefined/empty values", () => {
        expect(parseDateTime(null)).toBe("");
        expect(parseDateTime(undefined)).toBe("");
        expect(parseDateTime("")).toBe("");
    });

    it("parses an ISO datetime string", () => {
        expect(parseDateTime("2026-01-15T08:30")).toBe("2026-01-15T08:30");
    });

    it("parses a JavaScript Date object", () => {
        const d = new Date(Date.UTC(2026, 0, 15, 8, 30));
        expect(parseDateTime(d)).toBe("2026-01-15T08:30");
    });

    it("converts an Excel serial date number to a datetime string", () => {
        // Excel serial 46037 = January 15, 2026 (midnight UTC)
        expect(parseDateTime(46037)).toBe("2026-01-15T00:00");
    });

    it("does NOT produce a 1970-01-01 datetime for a realistic Excel serial", () => {
        const result = parseDateTime(46023);
        expect(result).not.toContain("1970");
    });

    it("returns empty string for an invalid datetime string", () => {
        expect(parseDateTime("not-a-date")).toBe("");
    });
});

describe("parseBoolean", () => {
    it("returns false for null/undefined", () => {
        expect(parseBoolean(null)).toBe(false);
        expect(parseBoolean(undefined)).toBe(false);
    });

    it('returns true for "true", "1", "yes", "on" (case-insensitive)', () => {
        expect(parseBoolean("true")).toBe(true);
        expect(parseBoolean("TRUE")).toBe(true);
        expect(parseBoolean("1")).toBe(true);
        expect(parseBoolean("yes")).toBe(true);
        expect(parseBoolean("YES")).toBe(true);
        expect(parseBoolean("on")).toBe(true);
    });

    it("returns false for other values", () => {
        expect(parseBoolean("false")).toBe(false);
        expect(parseBoolean("0")).toBe(false);
        expect(parseBoolean("no")).toBe(false);
        expect(parseBoolean("off")).toBe(false);
    });
});
