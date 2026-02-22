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
