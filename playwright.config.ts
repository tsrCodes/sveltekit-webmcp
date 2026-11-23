import { defineConfig, devices } from '@playwright/test';

// The default project uses Playwright's Chromium with the WebMCP polyfill.
// Set WEBMCP_NATIVE=1 to also run against installed Chrome with the native
// API turned on through the WebMCP feature switch. WEBMCP_CHANNEL picks the
// Chrome channel (chrome, chrome-beta, chrome-dev, chrome-canary) when the
// stable build does not ship the API yet.
const native = process.env.WEBMCP_NATIVE === '1';
const channel = process.env.WEBMCP_CHANNEL ?? 'chrome';

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
							channel,
							webmcpPolyfill: false,
							launchOptions: { args: ['--enable-features=WebMCP'] }
						}
					}
				]
			: [])
	]
});
