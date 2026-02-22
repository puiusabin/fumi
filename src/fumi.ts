import { compose } from "./compose.ts";
import {
	type AuthContext,
	type CloseContext,
	type ConnectContext,
	type DataContext,
	type FumiOptions,
	type MailFromContext,
	type Middleware,
	type Plugin,
	type RcptToContext,
} from "./types.ts";

export class Fumi {
	private _options: FumiOptions;
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
}
