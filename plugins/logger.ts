import type { Plugin } from "../index.js";

/**
 * Logs each SMTP phase to stdout.
 *
 *
 * @example
 * app.use(logger())
 */
export function logger(): Plugin {
  return (app) => {
    app.onConnect(async (ctx, next) => {
      console.log(`[connect] ${ctx.session.remoteAddress}`);
      await next();
    });

    app.onMailFrom(async (ctx, next) => {
      console.log(`[mail from] ${ctx.address.address}`);
      await next();
    });

    app.onRcptTo(async (ctx, next) => {
      console.log(`[rcpt to] ${ctx.address.address}`);
      await next();
    });

    app.onClose(async (ctx) => {
      console.log(`[close] ${ctx.session.remoteAddress}`);
    });
  };
}
