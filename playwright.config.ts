import { defineConfig, devices } from '@playwright/test';

// The default project uses Playwright's Chromium with the WebMCP polyfill.
// Set WEBMCP_NATIVE=1 to also run against installed Chrome with the native
// API turned on (needs a Chrome build that ships WebMCP behind the flag).
const native = process.env.WEBMCP_NATIVE === '1';

export default defineConfig<{ webmcpPolyfill: boolean }>({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	webServer: { command: 'pnpm preview', port: 4173, reuseExistingServer: true },
	use: { baseURL: 'http://localhost:4173' },
	projects: [
		{ name: 'polyfill', use: { ...devices['Desktop Chrome'] } },
		...(native
			? [
					{
						name: 'chrome-native',
						use: {
							...devices['Desktop Chrome'],
							channel: 'chrome',
							webmcpPolyfill: false,
							launchOptions: { args: ['--enable-features=WebMCPTesting'] }
						}
					}
				]
			: [])
	]
});
