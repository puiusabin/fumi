import type { Readable } from "node:stream";
import type { Fumi } from "./fumi.ts";

export class SMTPError extends Error {
	responseCode: number;

	constructor(message: string, responseCode = 550) {
		super(message);
		this.name = "SMTPError";
		this.responseCode = responseCode;
	}
}

export interface Address {
	address: string;
	args: Record<string, unknown>;
}

export interface Envelope {
	mailFrom: Address;
	rcptTo: Address[];
}

export interface Session {
	id: string;
	secure: boolean;
	remoteAddress: string;
	clientHostname: string;
	openingCommand: string;
	user: unknown;
	envelope: Envelope;
	transmissionType: string;
}

export interface Credentials {
	method: string;
	username: string;
	password: string;
	validatePassword: (password: string) => boolean;
}

export interface ConnectContext {
	session: Session;
	reject(message?: string, code?: number): never;
}

export interface AuthContext {
	session: Session;
	credentials: Credentials;
	accept(user: unknown): void;
	reject(message?: string, code?: number): never;
}

export interface MailFromContext {
	session: Session;
	address: Address;
	reject(message?: string, code?: number): never;
}

export interface RcptToContext {
	session: Session;
	address: Address;
	reject(message?: string, code?: number): never;
}

export interface DataContext {
	session: Session;
	stream: Readable;
	sizeExceeded: boolean;
	reject(message?: string, code?: number): never;
}

export interface CloseContext {
	session: Session;
}

export type Middleware<T> = (
	ctx: T,
	next: () => Promise<void>,
) => Promise<void>;

export type Plugin = (app: Fumi) => void;

export interface FumiOptions {
	// TLS
	secure?: boolean;
	key?: string | Buffer;
	cert?: string | Buffer;
	ca?: string | Buffer;

	// Auth
	authMethods?: string[];
	authOptional?: boolean;

	// Limits
	size?: number;
	maxClients?: number;

	// Behavior
	banner?: string;
	disabledCommands?: string[];
	hideSTARTTLS?: boolean;
	hidePIPELINING?: boolean;
	hideENHANCEDSTATUSCODES?: boolean;
	hideDSN?: boolean;
	hideREQUIRETLS?: boolean;
	lmtp?: boolean;
	useXClient?: boolean;
	useXForward?: boolean;
	logger?: boolean;

	allowInsecureAuth?: boolean;
	closeTimeout?: number;
}
