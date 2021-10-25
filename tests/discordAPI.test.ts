import fetch from 'node-fetch';

import { bulkUpdateCommands, updateCommand } from '../src/lib/util';
import { mockClient, mockCommand } from './testUtil';

jest.mock('node-fetch', () => jest.fn());
const fetchFn = fetch as jest.MockedFunction<typeof fetch>;

describe('discord api call tests', () => {
	afterEach(() => fetchFn.mockReset());
	test('bulk update commands', async () => {
		const { client, close } = await mockClient();
		try {
			const commands = Array.from(client.commands.pieces.values());
			await bulkUpdateCommands({ client, commands, isGlobal: false });
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(fetchFn).toHaveBeenCalledWith(
				`${client.discordBaseURL}/applications/${client.applicationID}/guilds/${client.developmentServerID}/commands`,
				{
					method: 'PUT',
					body: JSON.stringify(commands),
					headers: {
						Authorization: 'Bot FAKE_TOKEN',
						'Content-Type': 'application/json'
					}
				}
			);
			expect(fetchFn).toHaveReturned();
		} finally {
			close();
		}
	});
	test('bulk update commands globally', async () => {
		const { client, close } = await mockClient();
		try {
			const commands = Array.from(client.commands.pieces.values());
			await bulkUpdateCommands({ client, commands, isGlobal: true });
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(fetchFn).toHaveBeenCalledWith(
				`${client.discordBaseURL}/applications/${client.applicationID}/${client.developmentServerID}/commands`,
				{
					method: 'PUT',
					body: JSON.stringify(commands),
					headers: {
						Authorization: 'Bot FAKE_TOKEN',
						'Content-Type': 'application/json'
					}
				}
			);
			expect(fetchFn).toHaveReturned();
		} finally {
			close();
		}
	});

	test('single command update', async () => {
		const { client, close } = await mockClient();
		try {
			await updateCommand({ client, command: mockCommand, isGlobal: false });
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(fetchFn).toHaveBeenCalledWith(
				`${client.discordBaseURL}/applications/${client.applicationID}/guilds/${client.developmentServerID}/commands`,
				{
					method: 'POST',
					body: JSON.stringify(mockCommand),
					headers: {
						Authorization: 'Bot FAKE_TOKEN',
						'Content-Type': 'application/json'
					}
				}
			);
			expect(fetchFn).toHaveReturned();
		} finally {
			close();
		}
	});
	test('single command update globally', async () => {
		const { client, close } = await mockClient();
		try {
			await updateCommand({ client, command: mockCommand, isGlobal: true });
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(fetchFn).toHaveBeenCalledWith(
				`${client.discordBaseURL}/applications/${client.applicationID}/${client.developmentServerID}/commands`,
				{
					method: 'POST',
					body: JSON.stringify(mockCommand),
					headers: {
						Authorization: 'Bot FAKE_TOKEN',
						'Content-Type': 'application/json'
					}
				}
			);
			expect(fetchFn).toHaveReturned();
		} finally {
			close();
		}
	});
});
