import { describe, expect, it } from "vitest";
import { hashInviteToken, isInviteToken, normalizeInviteEmail } from "./parentInvites";

describe("parent invite helpers", () => {
	it("normalizes emails and recognizes tokens", () => {
		expect(normalizeInviteEmail(" Parent@Example.COM ")).toBe("parent@example.com");
		expect(isInviteToken("bad-token")).toBe(false);
		const token = "A".repeat(43);
		expect(isInviteToken(token)).toBe(true);
		expect(hashInviteToken(token)).toHaveLength(64);
	});
});
