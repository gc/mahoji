import type { APIInteraction } from 'discord-api-types/v9';
import type { FastifyRequest } from 'fastify';

import { CryptoKey, webcrypto } from './util';

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
