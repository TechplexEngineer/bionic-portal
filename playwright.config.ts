import { defineConfig } from "@playwright/test";

export default defineConfig({
	webServer: {
		command: "npm run db:migrate:local && npm run dev -- --host 127.0.0.1 --port 8788",
		port: 8788
	},
	testDir: "e2e"
});
