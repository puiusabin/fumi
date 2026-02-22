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
