import { describe, expect, it, vi } from 'vitest';
import { createLimiter } from '#lib/core/limit.js';
import { MESSAGES, runTool, type RunPlan } from '#lib/core/run.js';

const live = () => new AbortController().signal;

function plan(overrides: Partial<RunPlan> = {}): RunPlan {
	return { name: 't', description: 'Test', hints: {}, execute: () => 'done', ...overrides };
}

describe('runTool', () => {
	it('declines consequential tools without a confirm handler outside the browser', async () => {
		const result = await runTool(plan({ hints: { consequential: true } }), {}, live());
		expect(result).toEqual({ content: [{ type: 'text', text: MESSAGES.declined }], isError: true });
	});

	it('passes the request to a custom confirm handler', async () => {
		const confirm = vi.fn(async () => true);
		const result = await runTool(
			plan({ hints: { consequential: true }, confirm }),
			{ amount: 5 },
			live()
		);
		expect(result.content[0].text).toBe('done');
		expect(confirm).toHaveBeenCalledWith({
			toolName: 't',
			description: 'Test',
			input: { amount: 5 }
		});
	});

	it('returns Cancelled when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		const execute = vi.fn();
		const result = await runTool(plan({ execute }), {}, controller.signal);
		expect(result.content[0].text).toBe(MESSAGES.cancelled);
		expect(execute).not.toHaveBeenCalled();
	});

	it('returns Cancelled when execute throws after an abort', async () => {
		const controller = new AbortController();
		const result = await runTool(
			plan({
				execute: () => {
					controller.abort();
					throw new Error('aborted');
				}
			}),
			{},
			controller.signal
		);
		expect(result.content[0].text).toBe(MESSAGES.cancelled);
	});

	it('reports retry time when rate limited', async () => {
		const limiter = createLimiter({ calls: 1, per: '10s' });
		await runTool(plan({ limiter }), {}, live());
		const result = await runTool(plan({ limiter }), {}, live());
		expect(result.content[0].text).toBe(MESSAGES.rateLimited(10));
	});

	it('treats missing input as an empty object', async () => {
		const execute = vi.fn(() => 'ok');
		await runTool(plan({ execute, input: { type: 'object' } }), undefined, live());
		expect(execute).toHaveBeenCalledWith({}, { signal: expect.any(AbortSignal) });
	});
});
