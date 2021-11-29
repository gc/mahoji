import type { APIInteraction } from 'discord-api-types/v9';
import fastify, { FastifyInstance, FastifyRequest, FastifyServerOptions } from 'fastify';

import type { MahojiClient } from '../..';
import type { Adapter } from '../types';
import { CryptoKey, handleFormData, webcrypto } from '../util';

interface Response {
	message: string;
	error: string;
	statusCode: number;
}

export const makeErrorResponse = (err: string, code: number): Response => ({
	message: err,
	error: err,
	statusCode: code
});

declare module 'fastify' {
	interface FastifyReply {
		unauthorized(str?: string): FastifyReply;
		notFound(str?: string): FastifyReply;
		badRequest(str?: string): FastifyReply;
		internalServerError(str?: string): FastifyReply;
		tooManyRequests(str?: string): FastifyReply;
	}
}

/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable func-names */
function decorate(server: FastifyInstance) {
	server.decorateReply('unauthorized', function (string?: string) {
		this.code(401).send(makeErrorResponse(string ?? 'Unauthorized.', 401));
	});
	server.decorateReply('notFound', function (string?: string) {
		this.code(404).send(makeErrorResponse(string ?? 'Unauthorized.', 404));
	});
	server.decorateReply('badRequest', function (string?: string) {
		this.code(400).send(makeErrorResponse(string ?? 'Unauthorized.', 400));
	});
	server.decorateReply('internalServerError', function (string?: string) {
		this.code(500).send(makeErrorResponse(string ?? 'Unauthorized.', 500));
	});
	server.decorateReply('tooManyRequests', function (string?: string) {
		this.code(429).send(makeErrorResponse(string ?? 'Too many requests.', 429));
	});
}

type VerifiedCryptoResponse =
	| {
			isVerified: false;
			interaction: null;
	  }
	| {
			isVerified: true;
			interaction: APIInteraction;
	  };

const failedResponse: VerifiedCryptoResponse = {
	isVerified: false,
	interaction: null
};

export async function verifyDiscordCrypto({
	request,
	cryptoKey
}: {
	request: FastifyRequest;
	cryptoKey: CryptoKey;
}): Promise<VerifiedCryptoResponse> {
	const timestamp = request.headers['x-signature-timestamp'] ?? '';
	const signature = request.headers['x-signature-ed25519'] ?? '';

	const body = request.body as any;
	if (
		!body ||
		typeof body !== 'object' ||
		!timestamp ||
		!signature ||
		Array.isArray(timestamp) ||
		Array.isArray(signature) ||
		!body.id ||
		!body.type ||
		!body.application_id
	) {
		return failedResponse;
	}

	const timestampNumber = Number(timestamp);
	let convertedNow = Date.now() / 1000;

	if (isNaN(timestampNumber) || timestampNumber < convertedNow - 5) {
		return failedResponse;
	}

	const result: boolean = await webcrypto.subtle.verify(
		'NODE-ED25519',
		cryptoKey,
		Buffer.from(signature, 'hex'),
		Buffer.from(timestamp + JSON.stringify(body))
	);
	if (!result) return failedResponse;

	return {
		isVerified: true,
		interaction: request.body as APIInteraction
	};
}

export class FastifyAdapter implements Adapter {
	client: MahojiClient;
	interactionsEndpointURL: string;
	httpPort: number;
	server: FastifyInstance;
	cryptoKey: Promise<CryptoKey>;
	discordPublicKey: string;

	constructor({
		fastifyOptions,
		client,
		httpPort,
		interactionsEndpointURL,
		discordPublicKey
	}: {
		client: MahojiClient;
		fastifyOptions: FastifyServerOptions;
		interactionsEndpointURL: string;
		httpPort: number;
		discordPublicKey: string;
	}) {
		this.client = client;
		this.client.adapters.push(this);
		this.interactionsEndpointURL = interactionsEndpointURL;
		this.httpPort = httpPort;
		this.discordPublicKey = discordPublicKey;

		this.cryptoKey = webcrypto.subtle.importKey(
			'raw',
			Buffer.from(this.discordPublicKey, 'hex'),
			{ name: 'NODE-ED25519', namedCurve: 'NODE-ED25519', public: true },
			false,
			['verify']
		);

		this.server = fastify(fastifyOptions);

		// this.server.addHook('onError', (__, _, err) => console.error(err));

		// this.server.setErrorHandler((error, _, reply) => {
		// 	console.error(error);
		// 	if (error.)
		// 	reply.status(500).send({
		// 		message: 'Internal server error',
		// 		error: 'Internal server error',
		// 		statusCode: 500
		// 	});
		// });

		this.server.post(this.interactionsEndpointURL, async (req, res) => {
			const result = await verifyDiscordCrypto({
				request: req,
				cryptoKey: await this.cryptoKey
			});

			if (!result.isVerified) {
				return res.badRequest();
			}

			const response = await this.client.parseInteraction(result.interaction);
			if (response) {
				const formData = handleFormData(response);
				res.headers(formData.getHeaders()).send(formData);
				return;
			}

			return res.notFound();
		});

		decorate(this.server);
	}

	async init() {
		await this.cryptoKey;
		await this.server.listen(this.httpPort);
	}
}
