/* eslint-disable @typescript-eslint/unbound-method */
import { bulkUpdateCommands, convertCommandToAPICommand, updateCommand } from '../src/lib/util';
import { mockClient, mockCommand } from './testUtil';

describe('discord api call tests', () => {
	test('bulk update commands', async () => {
		const { client, close } = await mockClient();
		try {
			const commands = Array.from(client.commands.pieces.values());
			await bulkUpdateCommands({ client, commands, guildID: client.developmentServerID });
			expect(client.restManager.put).toHaveBeenCalledWith(
				'/applications/661440240656842762/guilds/228822415189344257/commands',
				{
					body: commands.map(convertCommandToAPICommand)
				}
			);
		} finally {
			close();
		}
	});

	test('bulk update commands globally', async () => {
		const { client, close } = await mockClient();

		try {
			const commands = Array.from(client.commands.pieces.values());
			await bulkUpdateCommands({ client, commands, guildID: null });
			expect(client.restManager.put).toHaveBeenCalledWith('/applications/661440240656842762/commands', {
				body: commands.map(convertCommandToAPICommand)
			});
		} finally {
			close();
		}
	});

	test('single command update', async () => {
		const { client, close } = await mockClient();
		try {
			await updateCommand({ client, command: mockCommand, guildID: client.developmentServerID });
			expect(client.restManager.post).toHaveBeenCalledWith(
				'/applications/661440240656842762/guilds/228822415189344257/commands',
				{
					body: convertCommandToAPICommand(mockCommand)
				}
			);
		} finally {
			close();
		}
	});

	test('single command update global', async () => {
		const { client, close } = await mockClient();
		try {
			await updateCommand({ client, command: mockCommand, guildID: null });
			expect(client.restManager.post).toHaveBeenCalledWith('/applications/661440240656842762/commands', {
				body: convertCommandToAPICommand(mockCommand)
			});
		} finally {
			close();
		}
	});

	test('updating changed commands', async () => {
		const { client, close } = await mockClient({ clientCommands: [] });
		try {
			await updateCommand({ client, command: mockCommand, guildID: null });
			expect(client.restManager.post).toHaveBeenCalledWith('/applications/661440240656842762/commands', {
				body: convertCommandToAPICommand(mockCommand)
			});
		} finally {
			close();
		}
	});
});
