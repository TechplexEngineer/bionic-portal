import devtoolsJson from "vite-plugin-devtools-json";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit(), devtoolsJson()],
	resolve: mode === "test" ? { conditions: ["browser"] } : undefined,
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "client",
					environment: "jsdom",
					include: ["src/lib/components/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/lib/server/**"],
					setupFiles: ["./vitest-setup-client.ts"]
				}
			},
			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: [
						"src/**/*.svelte.{test,spec}.{js,ts}",
						"src/lib/components/**/*.{test,spec}.{js,ts}"
					]
				}
			}
		]
	},
	css: {
		preprocessorOptions: {
			scss: {
				// api: 'modern-compiler', // or "modern"
				silenceDeprecations: ["import"]
			}
		}
	}
}));
