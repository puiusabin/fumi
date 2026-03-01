import type { Plugin } from "../index.js";

/**
 * Rejects messages that exceed a byte limit.
 *
 *
 * NOTE: FumiOptions.size must be set to the same byte value so that
 * bun-smtp tracks message size and sets sizeExceeded on the stream.
 *
 * @example
 * const app = new Fumi({ size: 1_000_000 })
 * app.use(maxSize(1_000_000))
 */
export function maxSize(bytes: number): Plugin {
	return (app) => {
		app.onData(async (ctx, next) => {
			await next();
			await ctx.stream.pipeTo(new WritableStream());
			if (ctx.sizeExceeded) {
				ctx.reject(`Message exceeds the maximum size of ${bytes} bytes`, 552);
			}
		});
	};
}
