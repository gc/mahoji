/* eslint-disable @typescript-eslint/unbound-method */
import { convertCommandToAPICommand, updateCommand } from '../src/lib/util';
import { mockClient, mockCommand } from './testUtil';

describe('discord api call tests', () => {
	test('updating changed commands', async () => {
		const { client, close } = await mockClient({
			clientCommands: [mockCommand, mockCommand, mockCommand, mockCommand, mockCommand]
		});
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
		const { client, close } = await mockClient({
			clientCommands: [mockCommand, mockCommand, mockCommand, mockCommand, mockCommand].map(i => ({
				...i,
				name: (Math.random() * 10_000).toString()
			}))
		});
		try {
			await updateCommand({ client, command: mockCommand, guildID: null });
			expect(client.restManager.post).toHaveBeenCalledWith('/applications/661440240656842762/commands', {
				body: convertCommandToAPICommand(mockCommand)
			});
		} finally {
			close();
		}
	});
	test('storeDirs', async () => {
		const client = await mockClient({
			storeDirs: null
		});
		client.close();
		const client2 = await mockClient({
			storeDirs: []
		});
		client2.close();
	});
	test('fastifyOptions', async () => {
		const client = await mockClient({
			fastifyOptions: undefined
		});
		client.close();
		const client2 = await mockClient({
			fastifyOptions: {}
		});
		client2.close();
	});
});
