import {
	cachedCommandsAreEqual,
	convertCommandToAPICommand,
	convertCommandToCachedCommand,
	isValidCommand,
	sha256Hash
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
			options: sha256Hash(JSON.stringify(command.options)),
			name: 'test',
			description: 'This is a fake, testing command!'
		});
	});
	test('sha256Hash', async () => {
		expect(sha256Hash('x')).toEqual('2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881');
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
});
