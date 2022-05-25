import {
	APIChatInputApplicationCommandInteraction,
	APIInteractionGuildMember,
	Locale,
	MessageFlags,
	PermissionFlagsBits
} from 'discord-api-types/v9';

import { commandInteractionBase, mockClient, mockMember, mockSnowflake } from './testUtil';

describe('server handles requests', () => {
	test('handles requiredPermissions with permissions', async () => {
		const { inject, close } = await mockClient();

		const memberWithPerms: APIInteractionGuildMember = {
			...mockMember,
			permissions: BigInt(PermissionFlagsBits.AddReactions).toString()
		};

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			member: memberWithPerms,
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
			},
			locale: Locale.EnglishUS
		};

		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: 'kyra, Pong!'.repeat(5)
			},
			type: 4
		});
		await close();
	});

	test('handles requiredPermissions without permissions', async () => {
		const { inject, close } = await mockClient();

		const memberWithoutPerms: APIInteractionGuildMember = { ...mockMember, permissions: BigInt(0).toString() };

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			member: memberWithoutPerms,
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
			},
			locale: Locale.EnglishUS
		};
		expect(await inject(commandInteraction)).toStrictEqual({
			data: {
				content: "You don't have permission to use this command.",
				flags: MessageFlags.Ephemeral
			},
			type: 4
		});
		await close();
	});

	test('handles requiredPermissions when no member present', async () => {
		const { close, inject } = await mockClient();

		const commandInteraction: APIChatInputApplicationCommandInteraction = {
			...commandInteractionBase,
			member: undefined,
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
			},
			locale: Locale.EnglishUS
		};

		expect(await inject(commandInteraction)).toStrictEqual({
			error: 'Not Found',
			message: 'Not Found',
			statusCode: 404
		});
		await close();
	});
});
