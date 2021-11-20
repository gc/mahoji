import { convertAPIOptionsToCommandOptions, convertCommandToAPICommand, isValidCommand } from '../src/lib/util';
import { commandInteractionModActions } from './data/command_interaction';
import { mockCommand } from './testUtil';

describe('utils', () => {
	test('convertMahojiCommandToAPICommand', async () => {
		const command = mockCommand;
		expect(convertCommandToAPICommand(command)).toStrictEqual({
			name: 'test',
			description: 'This is a fake, testing command!',
			options: []
		});
	});
	test('isValidCommand', () => {
		const validCommand = mockCommand;
		expect(isValidCommand(validCommand)).toEqual(true);
		const invalidCommands = [
			undefined,
			{},
			{
				...validCommand,
				description: undefined
			},
			{
				...validCommand,
				description: ''
			},
			{
				...validCommand,
				description: 'AAA'.repeat(100)
			},
			{
				...validCommand,
				run: null
			},
			{
				...validCommand,
				name: undefined
			},
			{
				...validCommand,
				name: 'AAA'.repeat(100)
			}
		];
		for (const cmd of invalidCommands) {
			expect(isValidCommand(cmd)).toEqual(false);
		}
	});
	test('convertAPIOptionsToCommandOptions', async () => {
		expect(convertAPIOptionsToCommandOptions(undefined, {})).toStrictEqual({});
		expect(convertAPIOptionsToCommandOptions([], {})).toStrictEqual({});

		// expect(
		// 	convertAPIOptionsToCommandOptions(
		// 		[
		// 			{
		// 				type: 2,
		// 				options: [
		// 					{
		// 						type: 1,
		// 						name: 'spawnrandomcards'
		// 					}
		// 				],
		// 				name: 'command'
		// 			}
		// 		] as any,
		// 		{}
		// 	)
		// ).toStrictEqual({ spawnrandomcards: {} });
		expect(
			convertAPIOptionsToCommandOptions(
				commandInteractionModActions.data.options,
				commandInteractionModActions.data.resolved
			)
		).toStrictEqual({
			channel: {
				id: '645509578489987082',
				name: 'general',
				permissions: '1099511627775',
				type: 0
			},
			mentionable: '157797566833098752',
			role: {
				color: 0,
				hoist: false,
				icon: null,
				id: '228822415189344257',
				managed: false,
				mentionable: false,
				name: '@everyone',
				permissions: '1071631420993',
				position: 0,
				unicode_emoji: null
			},
			user: {
				member: {
					avatar: null,
					is_pending: false,
					joined_at: '2016-12-15T17:24:26.926000+00:00',
					nick: null,
					pending: false,
					permissions: '1099511627775',
					premium_since: null,
					roles: ['645508567457202176', '574491033660948485']
				},
				user: {
					avatar: 'a_58c11318d45efbde40e37dd1ac7408b0',
					discriminator: '7556',
					id: '157797566833098752',
					public_flags: 131_712,
					username: 'Magnaboy'
				}
			}
		});
	});
});
