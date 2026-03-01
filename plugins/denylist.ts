import type { Plugin } from "../index.js";

/**
 * Blocks connections from a set of IP addresses.
 *
 *
 * @example
 * app.use(denylist(["1.2.3.4", "5.6.7.8"]))
 */
export function denylist(ips: string[]): Plugin {
	const blocked = new Set(ips);
	return (app) => {
		app.onConnect(async (ctx, next) => {
			if (blocked.has(ctx.session.remoteAddress)) {
				ctx.reject("Connection refused", 550);
			}
			await next();
		});
	};
}
