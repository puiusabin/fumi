import type { Plugin } from "../index.js";

/**
 * Only accepts recipients whose domain is in an allowed list.
 *
 *
 * @example
 * app.use(rcptFilter(["mycompany.com", "subsidiary.com"]))
 */
export function rcptFilter(allowedDomains: string[]): Plugin {
  const allowed = new Set(allowedDomains.map((d) => d.toLowerCase()));
  return (app) => {
    app.onRcptTo(async (ctx, next) => {
      const domain = ctx.address.address.split("@")[1]?.toLowerCase() ?? "";
      if (!allowed.has(domain)) {
        ctx.reject(`Recipient domain ${domain} not accepted`, 550);
      }
      await next();
    });
  };
}
