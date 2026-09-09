import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMagicLink, sendParentFormInvite } from "./brevo";

afterEach(() => vi.unstubAllGlobals());

describe("Brevo magic links", () => {
	it("sends a parent form invitation with a safe return link", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "sent" })));
		vi.stubGlobal("fetch", fetchMock);
		await sendParentFormInvite(
			"Parent@example.com",
			"Alex Student",
			"Spring Event",
			"https://portal.example/dashboard/parent/forms/invite-1?token=abc",
			"test-key"
		);
		const request = fetchMock.mock.calls[0][1];
		const body = JSON.parse(request.body);
		expect(body.to).toEqual([{ email: "Parent@example.com" }]);
		expect(body.subject).toContain("Alex Student");
		expect(body.htmlContent).toContain("Spring Event");
		expect(body.htmlContent).toContain("dashboard/parent/forms/invite-1");
	});

	it("sends the sign-in URL with the configured sender and API key", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ messageId: "sent" })));
		vi.stubGlobal("fetch", fetchMock);
		await sendMagicLink(
			"member@example.com",
			"https://portal.example/login/verify?token=abc&x=1",
			"test-key"
		);
		const [endpoint, request] = fetchMock.mock.calls[0];
		expect(endpoint).toBe("https://api.brevo.com/v3/smtp/email");
		expect(request.headers["api-key"]).toBe("test-key");
		const body = JSON.parse(request.body);
		expect(body.sender).toEqual({ name: "Team 4909 No Reply", email: "no-reply@team4909.org" });
		expect(body.to).toEqual([{ email: "member@example.com" }]);
		expect(body.htmlContent).toContain(
			'href="https://portal.example/login/verify?token=abc&amp;x=1"'
		);
		expect(body.htmlContent).toContain("15 minutes");
	});
	it("fails without a key without making a request", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		await expect(sendMagicLink("member@example.com", "https://portal.example", "")).rejects.toThrow(
			"BREVO_API_KEY"
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it("rejects delivery failures without exposing provider response contents", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("private details", { status: 401 }))
		);
		await expect(
			sendMagicLink("member@example.com", "https://portal.example", "bad-key")
		).rejects.toThrow("Email delivery failed (401)");
	});
});
