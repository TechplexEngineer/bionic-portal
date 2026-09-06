import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("admin event deletion", () => {
	it("cancels the enhanced submission before setting the deleting state", () => {
		const deleteForm = pageMarkup.match(/<form[\s\S]*?action="\?\/delete"[\s\S]*?<\/form>/)?.[0];

		expect(deleteForm).toBeDefined();
		expect(deleteForm).toContain("use:enhance={({ cancel }) =>");
		expect(deleteForm).toContain("cancel();");
		expect(deleteForm).not.toContain("onsubmit=");
		expect(deleteForm?.indexOf("cancel();")).toBeLessThan(
			deleteForm!.indexOf("deletingId = event.id")
		);
	});
});
