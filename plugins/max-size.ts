import type { Plugin } from "../index.ts";

/**
 * Rejects messages that exceed a byte limit.
 *
 *
 * NOTE: FumiOptions.size must be set to the same byte value so that
 * smtp-server tracks message size and sets sizeExceeded on the stream.
 *
 * @example
 * const app = new Fumi({ size: 1_000_000 })
 * app.use(maxSize(1_000_000))
 */
export function maxSize(bytes: number): Plugin {
  return (app) => {
    app.onData(async (ctx, next) => {
      if (ctx.sizeExceeded) {
        ctx.reject(`Message exceeds the maximum size of ${bytes} bytes`, 552);
      }
      await next();
    });
  };
}
