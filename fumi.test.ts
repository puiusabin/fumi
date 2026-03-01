import { afterEach, expect, test } from "bun:test";
import { Fumi, SMTPError } from "./index.ts";
import { denylist } from "./plugins/denylist.ts";
import { logger } from "./plugins/logger.ts";
import { maxSize } from "./plugins/max-size.ts";
import { rcptFilter } from "./plugins/rcpt-filter.ts";
import { requireTls } from "./plugins/require-tls.ts";
import { senderBlock } from "./plugins/sender-block.ts";
import { compose } from "./src/compose.ts";

// Walk through an SMTP conversation over raw TCP.
// Sends each command after receiving a complete response, returns all response lines.
// For DATA mode: combine the full body + terminator as a single entry in commands,
// since the server only responds once after the final ".\r\n".
function smtpTalk(port: number, commands: string[]): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const responses: string[] = [];
		let buf = "";
		let cmdIdx = 0;

		Bun.connect({
			hostname: "127.0.0.1",
			port,
			socket: {
				data(socket, data: Buffer) {
					buf += data.toString();
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
				},
				close() {
					resolve(responses);
				},
				error(_, err) {
					reject(err);
				},
			},
		}).catch(reject);
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
	await run({});
});

test("compose throws when next() is called twice", async () => {
	const run = compose<object>([
		async (_, next) => {
			await next();
			await next();
		},
	]);
	try {
		await run({});
		expect(true).toBe(false);
	} catch (err) {
		expect((err as Error).message).toBe("next() called multiple times");
	}
});

test("compose propagates errors from middleware", async () => {
	const run = compose<object>([
		async () => {
			throw new Error("boom");
		},
	]);
	try {
		await run({});
		expect(true).toBe(false);
	} catch (err) {
		expect((err as Error).message).toBe("boom");
	}
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
	expect(code(responses[0] ?? "")).toBe(220);
});

test("onConnect middleware runs and can reject", async () => {
	app = new Fumi({ authOptional: true });
	app.onConnect(async (ctx) => {
		ctx.reject("Go away", 550);
	});
	await app.listen(12511);

	const responses = await smtpTalk(12511, []);
	expect(code(responses[0] ?? "")).toBe(550);
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

test("onAuth accept grants access", async () => {
	app = new Fumi({ authMethods: ["PLAIN"], allowInsecureAuth: true });
	app.onAuth(async (ctx, next) => {
		if (
			ctx.credentials.username === "admin" &&
			ctx.credentials.password === "secret"
		) {
			ctx.accept({ id: 1 });
		} else {
			ctx.reject("Bad credentials", 535);
		}
		await next();
	});
	await app.listen(12515);

	const responses = await smtpTalk(12515, [
		"EHLO test",
		`AUTH PLAIN ${Buffer.from("\0admin\0secret").toString("base64")}`,
		"QUIT",
	]);
	const authResponse = responses.find((r) => code(r) === 235);
	expect(authResponse).toBeDefined();
});

test("onAuth reject denies access", async () => {
	app = new Fumi({ authMethods: ["PLAIN"], allowInsecureAuth: true });
	app.onAuth(async (ctx) => {
		ctx.reject("Bad credentials", 535);
	});
	await app.listen(12516);

	const responses = await smtpTalk(12516, [
		"EHLO test",
		`AUTH PLAIN ${Buffer.from("\0user\0wrong").toString("base64")}`,
		"QUIT",
	]);
	const rejected = responses.find((r) => code(r) === 535);
	expect(rejected).toBeDefined();
});

test("plugin system registers hooks via use()", async () => {
	app = new Fumi({ authOptional: true });
	let pluginRan = false;

	const myPlugin = (instance: Fumi) => {
		instance.onConnect(async (_ctx, next) => {
			pluginRan = true;
			await next();
		});
	};

	app.use(myPlugin);
	await app.listen(12517);

	await smtpTalk(12517, ["QUIT"]);
	expect(pluginRan).toBe(true);
});

test("onData receives full message stream", async () => {
	app = new Fumi({ authOptional: true });
	let receivedBody = "";

	app.onData(async (ctx, next) => {
		const chunks: Uint8Array[] = [];
		for await (const chunk of ctx.stream) {
			chunks.push(chunk);
		}
		receivedBody = Buffer.concat(chunks).toString();
		await next();
	});
	await app.listen(12518);

	await smtpTalk(12518, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<recipient@example.com>",
		"DATA",
		"Subject: hello\r\n\r\nHello world\r\n.",
		"QUIT",
	]);
	expect(receivedBody).toContain("Hello world");
});

test("onRcptTo middleware runs and reads address", async () => {
	app = new Fumi({ authOptional: true });
	let sawAddress = "";
	app.onRcptTo(async (ctx, next) => {
		sawAddress = ctx.address.address;
		await next();
	});
	await app.listen(12519);

	await smtpTalk(12519, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<recipient@example.com>",
		"QUIT",
	]);
	expect(sawAddress).toBe("recipient@example.com");
});

test("onRcptTo middleware can reject with custom code", async () => {
	app = new Fumi({ authOptional: true });
	app.onRcptTo(async (ctx) => {
		if (!ctx.address.address.endsWith("@allowed.example")) {
			ctx.reject("Recipient not accepted", 550);
		}
	});
	await app.listen(12520);

	const responses = await smtpTalk(12520, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<bad@blocked.example>",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 550);
	expect(rejectLine).toBeDefined();
});

test("onClose middleware fires after connection ends", async () => {
	app = new Fumi({ authOptional: true });
	let closeFired = false;
	app.onClose(async () => {
		closeFired = true;
	});
	await app.listen(12521);

	await smtpTalk(12521, ["QUIT"]);
	// onClose is fire-and-forget; give the server a tick to run it
	await Bun.sleep(10);
	expect(closeFired).toBe(true);
});

test("onAuth with no accept() call responds 535", async () => {
	app = new Fumi({ authMethods: ["PLAIN"], allowInsecureAuth: true });
	app.onAuth(async (_ctx, next) => {
		// never calls ctx.accept()
		await next();
	});
	await app.listen(12522);

	const responses = await smtpTalk(12522, [
		"EHLO test",
		`AUTH PLAIN ${Buffer.from("\0user\0pass").toString("base64")}`,
		"QUIT",
	]);
	const rejected = responses.find((r) => code(r) === 535);
	expect(rejected).toBeDefined();
});

test("non-SMTPError thrown in middleware is bridged to 5xx", async () => {
	app = new Fumi({ authOptional: true });
	app.onConnect(async () => {
		throw new Error("unexpected failure");
	});
	await app.listen(12523);

	const responses = await smtpTalk(12523, []);
	expect(code(responses[0] ?? "")).toBeGreaterThanOrEqual(500);
});

// --- plugins ---

test("denylist blocks connections from listed IPs", async () => {
	app = new Fumi({ authOptional: true });
	app.use(denylist(["127.0.0.1"]));
	await app.listen(12524);

	const responses = await smtpTalk(12524, []);
	expect(code(responses[0] ?? "")).toBe(550);
});

test("senderBlock rejects mail from blocked domain", async () => {
	app = new Fumi({ authOptional: true });
	app.use(senderBlock(["spam.example"]));
	await app.listen(12525);

	const responses = await smtpTalk(12525, [
		"EHLO test",
		"MAIL FROM:<attacker@spam.example>",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 550);
	expect(rejectLine).toBeDefined();
});

test("rcptFilter rejects recipients outside allowed domains", async () => {
	app = new Fumi({ authOptional: true });
	app.use(rcptFilter(["mycompany.com"]));
	await app.listen(12526);

	const responses = await smtpTalk(12526, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<user@other.com>",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 550);
	expect(rejectLine).toBeDefined();
});

test("requireTls rejects MAIL FROM on unencrypted connection", async () => {
	app = new Fumi({ authOptional: true });
	app.use(requireTls());
	await app.listen(12527);

	const responses = await smtpTalk(12527, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 530);
	expect(rejectLine).toBeDefined();
});

test("maxSize rejects oversized messages", async () => {
	app = new Fumi({ authOptional: true, size: 10 });
	app.use(maxSize(10));
	await app.listen(12528);

	const responses = await smtpTalk(12528, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<recipient@example.com>",
		"DATA",
		"Subject: test\r\n\r\nThis body is definitely longer than ten bytes.\r\n.",
		"QUIT",
	]);
	const rejectLine = responses.find((r) => code(r) === 552);
	expect(rejectLine).toBeDefined();
});

test("logger plugin does not interfere with normal flow", async () => {
	app = new Fumi({ authOptional: true });
	app.use(logger());
	await app.listen(12529);

	const responses = await smtpTalk(12529, [
		"EHLO test",
		"MAIL FROM:<sender@example.com>",
		"RCPT TO:<recipient@example.com>",
		"QUIT",
	]);
	expect(code(responses[0] ?? "")).toBe(220);
	const mailResponse = responses.find((r) => code(r) === 250 && responses.indexOf(r) > 1);
	expect(mailResponse).toBeDefined();
});
