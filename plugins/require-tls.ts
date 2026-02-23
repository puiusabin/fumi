import type { Plugin } from "../index.ts";

/**
 * Rejects MAIL FROM on unencrypted connections.
 *
 * Use with STARTTLS — by the time MAIL FROM arrives, the client has had
 * its chance to upgrade. Code 530 is the standard RFC 3207 response.
 *
 * For protocol-level enforcement without middleware, set
 * `requireTLS: true` in FumiOptions instead.
 *
 * @example
 * app.use(requireTls())
 */
export function requireTls(): Plugin {
	return (app) => {
		app.onMailFrom(async (ctx, next) => {
			if (!ctx.session.secure) {
				ctx.reject("Must issue STARTTLS first", 530);
			}
			await next();
		});
	};
}
