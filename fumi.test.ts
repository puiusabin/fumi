import { afterEach, expect, test } from "bun:test";
import net from "node:net";
import { Fumi, SMTPError } from "./index.ts";
import { compose } from "./src/compose.ts";

// Walk through an SMTP conversation over raw TCP.
// Sends each command after receiving a complete response, returns all response lines.
// For DATA mode: combine the full body + terminator as a single entry in commands,
// since the server only responds once after the final ".\r\n".
function smtpTalk(port: number, commands: string[]): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const socket = net.createConnection({ port, host: "127.0.0.1" });
		const responses: string[] = [];
		let buf = "";
		let cmdIdx = 0;

		function flush() {
			while (true) {
				const idx = buf.indexOf("\r\n");
				if (idx === -1) break;
				const line = buf.slice(0, idx);
				buf = buf.slice(idx + 2);
				if (!line) continue;
				responses.push(line);
				if (line[3] === "-") continue; // multi-line continuation
				if (cmdIdx < commands.length) {
					socket.write(`${commands[cmdIdx++]}\r\n`);
				} else {
					socket.end();
				}
			}
		}

		socket.on("data", (d) => {
			buf += d.toString();
			flush();
		});
		socket.on("end", () => resolve(responses));
		socket.on("error", reject);
	});
}

function code(line: string): number {
	return parseInt(line.slice(0, 3), 10);
}

// --- unit: compose ---

test("compose runs middleware in order", async () => {
	const order: number[] = [];
	const run = compose<object>([
		async (_, next) => {
			order.push(1);
			await next();
			order.push(4);
		},
		async (_, next) => {
			order.push(2);
			await next();
			order.push(3);
		},
	]);
	await run({});
	expect(order).toEqual([1, 2, 3, 4]);
});

test("compose with no middleware resolves immediately", async () => {
	const run = compose<object>([]);
	await expect(run({})).resolves.toBeUndefined();
});

test("compose throws when next() is called twice", async () => {
	const run = compose<object>([
		async (_, next) => {
			await next();
			await next();
		},
	]);
	await expect(run({})).rejects.toThrow("next() called multiple times");
});

test("compose propagates errors from middleware", async () => {
	const run = compose<object>([
		async () => {
			throw new Error("boom");
		},
	]);
	await expect(run({})).rejects.toThrow("boom");
});

// --- unit: SMTPError ---

test("SMTPError carries responseCode", () => {
	const err = new SMTPError("Rejected", 450);
	expect(err.responseCode).toBe(450);
	expect(err.message).toBe("Rejected");
	expect(err).toBeInstanceOf(Error);
});

test("SMTPError defaults responseCode to 550", () => {
	const err = new SMTPError("No reason given");
	expect(err.responseCode).toBe(550);
});

// --- integration ---

let app: Fumi;

afterEach(async () => {
	await app?.close();
});

test("server sends 220 banner on connect", async () => {
	app = new Fumi({ authOptional: true });
	await app.listen(12510);

	const responses = await smtpTalk(12510, ["QUIT"]);
	expect(code(responses[0])).toBe(220);
});

test("onConnect middleware runs and can reject", async () => {
	app = new Fumi({ authOptional: true });
	app.onConnect(async (ctx) => {
		ctx.reject("Go away", 550);
	});
	await app.listen(12511);

	const responses = await smtpTalk(12511, []);
	expect(code(responses[0])).toBe(550);
});

test("onMailFrom middleware runs and accepts by default", async () => {
	app = new Fumi({ authOptional: true });
	let sawAddress = "";
	app.onMailFrom(async (ctx, next) => {
		sawAddress = ctx.address.address;
		await next();
	});
	await app.listen(12512);

	const responses = await smtpTalk(12512, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"QUIT",
	]);
	expect(sawAddress).toBe("sender@example.com");
	const mailResponse = responses.find(
		(r) => r.startsWith("250") && responses.indexOf(r) > 1,
	);
	expect(mailResponse).toBeDefined();
	expect(code(mailResponse ?? "")).toBe(250);
});

test("onMailFrom middleware can reject with custom code", async () => {
	app = new Fumi({ authOptional: true });
	app.onMailFrom(async (ctx) => {
		if (ctx.address.address.endsWith("@blocked.example")) {
			ctx.reject("Domain blocked", 550);
		}
	});
	await app.listen(12513);

	const responses = await smtpTalk(12513, [
		"EHLO test",
		"MAIL FROM:<bad@blocked.example>",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 550);
	expect(rejectLine).toBeDefined();
});

test("multiple onMailFrom middlewares chain correctly", async () => {
	app = new Fumi({ authOptional: true });
	const order: number[] = [];
	app.onMailFrom(async (_ctx, next) => {
		order.push(1);
		await next();
	});
	app.onMailFrom(async (_ctx, next) => {
		order.push(2);
		await next();
	});
	await app.listen(12514);

	await smtpTalk(12514, ["EHLO test", "MAIL FROM:<a@b.com>", "QUIT"]);
	expect(order).toEqual([1, 2]);
});
