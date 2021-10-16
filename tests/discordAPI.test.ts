import fetch from 'node-fetch';

import { bulkUpdateCommands } from '../src/lib/util';
import { mockClient } from './testUtil';

jest.mock('node-fetch', () => jest.fn());

describe('discord api call tests', () => {
	test('bulk update commands', async () => {
		const { client, close } = await mockClient();
		const fetchFn = fetch as jest.MockedFunction<typeof fetch>;
		try {
			const commands = Array.from(client.commands.pieces.values());
			await bulkUpdateCommands(client, commands);
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
});
