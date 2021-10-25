import {
	cachedCommandsAreEqual,
	convertAPIOptionsToCommandOptions,
	convertCommandToAPICommand,
	convertCommandToCachedCommand,
	isValidCommand
} from '../src/lib/util';
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
	test('cachedCommandsAreEqual', async () => {
		const command = mockCommand;
		const cachedCommand = convertCommandToCachedCommand(command);

		expect(cachedCommandsAreEqual(cachedCommand, cachedCommand)).toBe(true);
	});
	test('convertCommandToCachedCommand', async () => {
		const command = mockCommand;
		expect(convertCommandToCachedCommand(command)).toStrictEqual({
			options: JSON.stringify(command.options),
			name: 'test',
			description: 'This is a fake, testing command!'
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
		const testData = {
			application_id: '661440240656842762',
			channel_id: '892304844306653204',
			data: {
				id: '901750719596613662',
				name: 'modactions',
				options: [
					{
						name: 'ban',
						options: [
							{
								name: 'user',
								options: [
									{
										name: 'user',
										type: 6,
										value: '157797566833098752'
									}
								],
								type: 1
							}
						],
						type: 2
					}
				],
				resolved: {
					members: {
						'157797566833098752': {
							avatar: null,
							is_pending: false,
							joined_at: '2016-12-15T17:24:26.926000+00:00',
							nick: null,
							pending: false,
							permissions: '1099511627775',
							premium_since: null,
							roles: ['645508567457202176', '574491033660948485']
						}
					},
					users: {
						'157797566833098752': {
							avatar: 'a_58c11318d45efbde40e37dd1ac7408b0',
							discriminator: '7556',
							id: '157797566833098752',
							public_flags: 131_712,
							username: 'Magnaboy'
						}
					}
				},
				type: 1
			},
			guild_id: '228822415189344257',
			id: '901847193785348156',
			member: {
				avatar: null,
				deaf: false,
				is_pending: false,
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
			},
			token: 'aW50ZXJhY3Rpb246OTAxODQ3MTkzNzg1MzQ4MTU2OlppVFlla2ZDNGVubzJzcm9LeG44NE5yODNMY1N2SXVKZlVjbE5PQ2E5TjJDU204VVNzSUdrNHE4M3JCb0dGbzc5Q3l5QnBsRlRDWHhzNzVybzEzZ1NaUjkyVm5LajdNU2gyR2M2R21naExOWUxodkRMY0dHVjlaejV4a2hzRnBV',
			type: 2,
			version: 1
		};
		expect(convertAPIOptionsToCommandOptions(undefined, {})).toStrictEqual({});
		expect(convertAPIOptionsToCommandOptions([], {})).toStrictEqual({});
		expect(convertAPIOptionsToCommandOptions(testData.data.options, testData.data.resolved)).toStrictEqual({
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
