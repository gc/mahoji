// import Mitm from 'mitm';
import { join } from 'path';

import { APIInteractionGuildMember, MahojiClient } from '../src';
import type { ICommand } from '../src/lib/types';
import { CryptoKey, webcrypto } from '../src/lib/util';

// const mitm = Mitm();

// mitm.on('request', () => {
// 	throw new Error('Network requests forbidden in offline mode');
// });

type CryptoKeySignature = ArrayBuffer;

interface CryptoKeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}

export function generateKeyPair(): Promise<CryptoKeyPair> {
	return webcrypto.subtle.generateKey(
		{
			name: 'NODE-ED25519',
			namedCurve: 'NODE-ED25519',
			hash: 'SHA-256'
		},
		true,
		['sign', 'verify']
	);
}

export function encryptFromKeyPair(privateKey: CryptoKey, data: string): Promise<CryptoKeySignature> {
	return webcrypto.subtle.sign(
		{
			name: 'NODE-ED25519'
		},
		privateKey,
		data
	);
}

export function isCryptoVerified(publicKey: CryptoKey, signature: CryptoKeySignature, data: string) {
	return webcrypto.subtle.verify('NODE-ED25519', publicKey, signature, data);
}

function btoa(any: any) {
	return Buffer.from(any).toString('hex');
}

export async function hexKey(key: CryptoKey) {
	let rawKey = await webcrypto.subtle.exportKey('raw', key);
	return btoa(rawKey);
}

export interface MockedClient {
	keyPair: CryptoKeyPair;
	client: MahojiClient;
	makeHeaders: (data: string) => Promise<Record<string, string>>;
	close: () => void;
}

export async function mockClient(): Promise<MockedClient> {
	const keyPair = await generateKeyPair();
	const publicKey = await hexKey(keyPair.publicKey);
	const client = new MahojiClient({
		discordPublicKey: publicKey,
		discordToken: 'FAKE_TOKEN',
		developmentServerID: '228822415189344257',
		applicationID: '661440240656842762',
		fastifyOptions: {},
		interactionsEndpointURL: '/interactions',
		httpPort: 8322,
		storeDirs: [join('compiledtests', 'tests'), join('compiledtests', 'src')]
	});

	await client.start();

	async function makeHeaders(data: string) {
		const now = Math.floor(Date.now() / 1000);
		const headers = {
			'x-signature-timestamp': now.toString(),
			'x-signature-ed25519': Buffer.from(await encryptFromKeyPair(keyPair.privateKey, `${now}${data}`)).toString(
				'hex'
			),
			'content-type': 'application/json'
		};
		return headers;
	}

	async function close() {
		client.server.server.unref();
		return client.server.server.close();
	}

	const mockedClient: MockedClient = { keyPair, client, makeHeaders, close };

	return mockedClient;
}

export const mockCommand: ICommand = {
	name: 'test',
	description: 'This is a fake, testing command!',
	options: [],
	run: async ({ interaction }) => {
		return `Test successfull, ${interaction.member?.user.username}!`;
	}
};

export const mockSnowflake = '157797566833098752';

export const mockMember: APIInteractionGuildMember = {
	avatar: null,
	deaf: false,
	joined_at: '2016-12-15T17:24:26.926000+00:00',
	mute: false,
	nick: null,
	pending: false,
	permissions: '1099511627775',
	premium_since: null,
	roles: ['645508567457202176', '574491033660948485'],
	user: {
		avatar: 'a_58c11318d45efbde40e37dd1ac7408b0',
		discriminator: '7556',
		id: '157797566833098752',
		public_flags: 131_712,
		username: 'Magnaboy'
	}
};
