/** Window length: a number of milliseconds, or a string like `'30s'`, `'1m'`, `'2h'`. */
export type LimitWindow = number | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;

export interface RateLimit {
	/** Calls allowed inside one window. */
	calls: number;
	/** Window length. */
	per: LimitWindow;
}

export interface Limiter {
	/** Record a call. Returns `false` when the call is over the limit. */
	take(now?: number): boolean;
	/** Milliseconds until the next call is allowed (0 when one is allowed now). */
	retryAfter(now?: number): number;
	reset(): void;
}

const UNIT_MS: Record<string, number> = {
	ms: 1,
	s: 1_000,
	m: 60_000,
	h: 3_600_000,
	d: 86_400_000
};

const WINDOW_PATTERN = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/;

export function parseWindow(window: LimitWindow): number {
	if (typeof window === 'number') {
		if (window > 0) return window;
		throw new RangeError(`Rate limit window must be positive, got ${window}`);
	}
	const match = WINDOW_PATTERN.exec(window.trim());
	if (!match) throw new RangeError(`Invalid rate limit window "${window}"`);
	return Number(match[1]) * UNIT_MS[match[2]];
}

/** Sliding-window limiter. Client side only; server limits stay the app's job. */
export function createLimiter(limit: RateLimit): Limiter {
	if (!Number.isInteger(limit.calls) || limit.calls < 1) {
		throw new RangeError(`Rate limit calls must be a positive integer, got ${limit.calls}`);
	}
	const windowMs = parseWindow(limit.per);
	let stamps: number[] = [];

	const prune = (now: number) => {
		stamps = stamps.filter((stamp) => now - stamp < windowMs);
	};

	return {
		take(now = Date.now()) {
			prune(now);
			if (stamps.length >= limit.calls) return false;
			stamps = [...stamps, now];
			return true;
		},
		retryAfter(now = Date.now()) {
			prune(now);
			if (stamps.length < limit.calls) return 0;
			return windowMs - (now - stamps[0]);
		},
		reset() {
			stamps = [];
		}
	};
}
