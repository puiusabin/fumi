import type { Plugin } from "../index.js";

/**
 * Rejects mail from specific sender domains.
 *
 *
 * @example
 * app.use(senderBlock(["spam.example", "blocked.org"]))
 */
export function senderBlock(domains: string[]): Plugin {
	const blocked = new Set(domains.map((d) => d.toLowerCase()));
	return (app) => {
		app.onMailFrom(async (ctx, next) => {
			const domain = ctx.address.address.split("@")[1]?.toLowerCase() ?? "";
			if (blocked.has(domain)) {
				ctx.reject(`Mail from ${domain} is not accepted`, 550);
			}
			await next();
		});
	};
}
