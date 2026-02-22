import type { Middleware } from "./types.ts";

export function compose<T>(
	middlewares: Middleware<T>[],
): (ctx: T) => Promise<void> {
	return function dispatch(ctx: T): Promise<void> {
		let index = -1;

		function next(i: number): Promise<void> {
			if (i <= index)
				return Promise.reject(new Error("next() called multiple times"));
			index = i;
			const fn = middlewares[i];
			if (!fn) return Promise.resolve();
			return Promise.resolve(fn(ctx, () => next(i + 1)));
		}

		return next(0);
	};
}
