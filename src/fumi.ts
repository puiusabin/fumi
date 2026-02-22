// @ts-expect-error — smtp-server ships no type declarations
import { SMTPServer } from "smtp-server";
import { compose } from "./compose.ts";
import {
	type Address,
	type AuthContext,
	type CloseContext,
	type ConnectContext,
	type Credentials,
	type DataContext,
	type FumiOptions,
	type MailFromContext,
	type Middleware,
	type Plugin,
	type RcptToContext,
	type Session,
	SMTPError,
} from "./types.ts";

function makeReject(defaultCode: number) {
	return function reject(message = "Rejected", code = defaultCode): never {
		throw new SMTPError(message, code);
	};
}

function bridgeError(err: unknown): Error {
	const message = err instanceof Error ? err.message : String(err);
	const code = err instanceof SMTPError ? err.responseCode : 500;
	const bridged = new Error(message) as Error & { responseCode: number };
	bridged.responseCode = code;
	return bridged;
}

export class Fumi {
	private _options: FumiOptions;
	private _server: InstanceType<typeof SMTPServer> | null = null;
	private _connect: Middleware<ConnectContext>[] = [];
	private _auth: Middleware<AuthContext>[] = [];
	private _mailFrom: Middleware<MailFromContext>[] = [];
	private _rcptTo: Middleware<RcptToContext>[] = [];
	private _data: Middleware<DataContext>[] = [];
	private _close: Middleware<CloseContext>[] = [];

	constructor(options: FumiOptions = {}) {
		this._options = options;
	}

	use(plugin: Plugin): this {
		plugin(this);
		return this;
	}

	onConnect(fn: Middleware<ConnectContext>): this {
		this._connect.push(fn);
		return this;
	}

	onAuth(fn: Middleware<AuthContext>): this {
		this._auth.push(fn);
		return this;
	}

	onMailFrom(fn: Middleware<MailFromContext>): this {
		this._mailFrom.push(fn);
		return this;
	}

	onRcptTo(fn: Middleware<RcptToContext>): this {
		this._rcptTo.push(fn);
		return this;
	}

	onData(fn: Middleware<DataContext>): this {
		this._data.push(fn);
		return this;
	}

	onClose(fn: Middleware<CloseContext>): this {
		this._close.push(fn);
		return this;
	}

	listen(port: number, host?: string): Promise<void> {
		const server = this._buildServer();
		this._server = server;
		return new Promise((resolve, reject) => {
			server.on("error", reject);
			server.listen(port, host, resolve);
		});
	}

	close(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this._server) return resolve();
			this._server.close((err?: Error) => (err ? reject(err) : resolve()));
		});
	}

	private _buildServer(): InstanceType<typeof SMTPServer> {
		const connectRunner = compose(this._connect);
		const authRunner = compose(this._auth);
		const mailFromRunner = compose(this._mailFrom);
		const rcptToRunner = compose(this._rcptTo);
		const dataRunner = compose(this._data);
		const closeRunner = compose(this._close);

		return new SMTPServer({
			...this._options,

			onConnect(session: unknown, callback: (err?: Error) => void) {
				const ctx: ConnectContext = {
					session: session as Session,
					reject: makeReject(550),
				};
				connectRunner(ctx)
					.then(() => callback())
					.catch((err) => callback(bridgeError(err)));
			},

			onAuth(
				auth: unknown,
				session: unknown,
				callback: (err: Error | null, result?: { user: unknown }) => void,
			) {
				let acceptedUser: unknown;
				let wasAccepted = false;

				const ctx: AuthContext = {
					session: session as Session,
					credentials: auth as Credentials,
					accept(user: unknown) {
						wasAccepted = true;
						acceptedUser = user;
					},
					reject: makeReject(535),
				};

				authRunner(ctx)
					.then(() => {
						if (wasAccepted) {
							callback(null, { user: acceptedUser });
						} else {
							callback(
								bridgeError(new SMTPError("Authentication required", 535)),
							);
						}
					})
					.catch((err) => callback(bridgeError(err)));
			},

			onMailFrom(
				address: unknown,
				session: unknown,
				callback: (err?: Error) => void,
			) {
				const ctx: MailFromContext = {
					session: session as Session,
					address: address as Address,
					reject: makeReject(550),
				};
				mailFromRunner(ctx)
					.then(() => callback())
					.catch((err) => callback(bridgeError(err)));
			},

			onRcptTo(
				address: unknown,
				session: unknown,
				callback: (err?: Error) => void,
			) {
				const ctx: RcptToContext = {
					session: session as Session,
					address: address as Address,
					reject: makeReject(550),
				};
				rcptToRunner(ctx)
					.then(() => callback())
					.catch((err) => callback(bridgeError(err)));
			},

			onData(
				stream: unknown,
				session: unknown,
				callback: (err?: Error | null, message?: string) => void,
			) {
				const typedStream = stream as DataContext["stream"] & {
					sizeExceeded?: boolean;
				};
				const ctx: DataContext = {
					session: session as Session,
					stream: typedStream,
					sizeExceeded: typedStream.sizeExceeded ?? false,
					reject: makeReject(552),
				};
				dataRunner(ctx)
					.then(() => callback())
					.catch((err) => callback(bridgeError(err)));
			},

			onClose(session: unknown) {
				const ctx: CloseContext = { session: session as Session };
				closeRunner(ctx).catch(() => {
					// onClose is fire-and-forget; errors are swallowed silently
				});
			},
		});
	}
}
