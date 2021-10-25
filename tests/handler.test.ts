import {
	APIApplicationCommandInteraction,
	APIChatInputApplicationCommandInteraction,
	APIPingInteraction,
	InteractionType
} from 'discord-api-types/v9';

import { Time } from '../src/lib/util';
import { mockClient, mockCommand, mockMember, mockSnowflake } from './testUtil';

const baseRequest = { method: 'POST', url: '/interactions' } as const;
const commandInteractionBase = {
	id: '---',
	application_id: '--',
	type: InteractionType.ApplicationCommand,
	channel_id: mockSnowflake,
	version: 1,
	token: '---',
	member: mockMember
} as const;

describe('server handles requests', () => {
	test('handle good request', async () => {
		const { client, makeHeaders, close } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(payload)
		});
		expect(response.json()).toStrictEqual({ type: 1 });

		await close();
	});

	test('handle crypto-insecure request', async () => {
		const { client, makeHeaders, close } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: {
				...(await makeHeaders(payload)),
				'x-signature-timestamp': Math.floor(Date.now() / 1000) - Time.Second + 6
			}
		});
		expect(response.json()).toStrictEqual({
			error: 'Bad Request',
			message: 'Bad Request',
			statusCode: 400
		});
		await close();
	});

	test('handle invalid request', async () => {
		const { client, close } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: { 'content-type': 'application/json' }
		});
		expect(response.json()).toStrictEqual({
			error: 'Bad Request',
			message: 'Bad Request',
			statusCode: 400
		});
		await close();
	});

	test('handle invalid encryption', async () => {
		const { client, makeHeaders, close } = await mockClient();
		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(JSON.stringify({ type: '5' }))
		});
		expect(response.json()).toStrictEqual({
			error: 'Bad Request',
			message: 'Bad Request',
			statusCode: 400
		});
		await close();
	});

	test('handles commands', async () => {
		const { client, makeHeaders, close } = await mockClient();

		client.commands.pieces.set(mockCommand.name, mockCommand);

		const commandInteraction: APIApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: mockCommand.name,
				type: 1,
				options: []
			}
		};
		const payload = JSON.stringify(commandInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(payload)
		});
		expect(response.json()).toStrictEqual({
			data: {
				content: 'Test successfull, Magnaboy!'
			},
			type: 4
		});
		await close();
	});

	test('handles commands #2', async () => {
		const { client, makeHeaders, close } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: 'ping',
				type: 1,
				options: [
					{
						name: 'name',
						type: 3,
						value: 'kyra'
					},
					{
						name: 'quantity',
						type: 3,
						value: 5
					}
				]
			}
		};
		const payload = JSON.stringify(commandInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(payload)
		});
		expect(response.json()).toStrictEqual({
			data: {
				content: 'kyra, Pong!'.repeat(5)
			},
			type: 4
		});
		await close();
	});

	test('handles unfound commands', async () => {
		const { client, makeHeaders, close } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: mockCommand.name,
				type: 1,
				options: []
			}
		};
		const payload = JSON.stringify(commandInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(payload)
		});
		expect(response.json()).toStrictEqual({ error: 'Not Found', message: 'Not Found', statusCode: 404 });
		await close();
	});

	test('handles commands with subcommands', async () => {
		const { client, makeHeaders, close } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: mockCommand.name,
				type: 1,
				options: []
			}
		};
		const payload = JSON.stringify(commandInteraction);

		const response = await client.server.inject({
			...baseRequest,
			payload,
			headers: await makeHeaders(payload)
		});
		expect(response.json()).toStrictEqual({ error: 'Not Found', message: 'Not Found', statusCode: 404 });
		await close();
	});
});
