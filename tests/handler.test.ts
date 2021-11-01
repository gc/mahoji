import {
	APIApplicationCommandInteraction,
	APIChatInputApplicationCommandInteraction,
	APIPingInteraction,
	InteractionType
} from 'discord-api-types/v9';

import { Time } from '../src/lib/util';
import { baseRequest, commandInteractionBase, mockClient, mockCommand, mockSnowflake } from './testUtil';

describe('server handles requests', () => {
	test('handle missing/bad-type request', async () => {
		const { close, inject } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: 50,
			version: 1,
			token: '---'
		};

		expect(await inject(pingInteraction)).toStrictEqual({
			error: 'Not Found',
			message: 'Not Found',
			statusCode: 404
		});

		await close();
	});
	test('handle good request', async () => {
		const { inject, close } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};

		expect(await inject(pingInteraction)).toStrictEqual({ type: 1 });

		await close();
	});

	test('handle crypto-insecure request', async () => {
		const { fastifyAdapter, close, makeHeaders } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await fastifyAdapter.server.inject({
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
		const { fastifyAdapter, close } = await mockClient();

		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await fastifyAdapter.server.inject({
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
		const { fastifyAdapter, makeHeaders, close } = await mockClient();
		const pingInteraction: APIPingInteraction = {
			id: '---',
			application_id: '--',
			type: InteractionType.Ping,
			version: 1,
			token: '---'
		};
		const payload = JSON.stringify(pingInteraction);

		const response = await fastifyAdapter.server.inject({
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
		const { inject, close, client } = await mockClient();

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

		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: 'Test successfull, Magnaboy!'
			},
			type: 4
		});
		await close();
	});

	test('handles commands #2', async () => {
		const { close, inject } = await mockClient();

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

		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: 'kyra, Pong!'.repeat(5)
			},
			type: 4
		});
		await close();
	});

	test('handles commands #3', async () => {
		const { close, inject } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: 'mahoji',
				type: 1,
				options: [
					{
						name: 'command',
						type: 3,
						value: 'ping'
					}
				]
			}
		};

		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: 'Magnaboy, Pong!'
			},
			type: 4
		});
		await close();
	});

	test('handles unfound commands', async () => {
		const { close, inject } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: mockCommand.name,
				type: 1,
				options: []
			}
		};

		expect(await inject(commandInteraction)).toStrictEqual({
			error: 'Not Found',
			message: 'Not Found',
			statusCode: 404
		});
		await close();
	});

	test('handles commands with subcommands', async () => {
		const { close, inject } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: 'mahoji',
				type: 1,
				options: [
					{
						name: 'command',
						type: 1,
						value: 'ping'
					}
				]
			}
		};

		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: 'Magnaboy, Pong!'
			},
			type: 4
		});

		// no options
		const commandInteraction2: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: 'mahoji',
				type: 1,
				options: undefined
			}
		};

		expect(await inject(commandInteraction2)).toStrictEqual({
			data: {
				content: 'Magnaboy, Pong!'
			},
			type: 4
		});

		// no value
		const commandInteraction3: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			data: {
				id: mockSnowflake,
				name: 'mahoji',
				type: 1,
				options: [
					{
						name: 'command',
						type: 1
					} as any
				]
			}
		};

		expect(await inject(commandInteraction3)).toStrictEqual({
			data: {
				content: 'Magnaboy, Pong!'
			},
			type: 4
		});
		await close();
	});
});
