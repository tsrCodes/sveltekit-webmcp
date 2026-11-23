import type { ConfirmRequest } from '#lib/index.js';

/** A promise-based confirm dialog model: `ask()` resolves when the user answers. */
export class Confirmer {
	request = $state.raw<ConfirmRequest | undefined>(undefined);
	#resolve: ((allowed: boolean) => void) | undefined;

	ask = (request: ConfirmRequest): Promise<boolean> => {
		this.#resolve?.(false);
		this.request = request;
		return new Promise((resolve) => {
			this.#resolve = resolve;
		});
	};

	answer(allowed: boolean): void {
		this.#resolve?.(allowed);
		this.#resolve = undefined;
		this.request = undefined;
	}
}
