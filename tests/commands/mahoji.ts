import { ApplicationCommandOptionType } from 'discord-api-types/v9';

import type { CommandRunOptions, ICommand } from '../../src';
import { bulkUpdateCommands } from '../../src/lib/util';

export const command: ICommand = {
	name: 'mahoji',
	description: 'A command for managing Mahoji functions.',
	options: [
		{
			name: 'command',
			description: 'The command you want to invoke',
			type: ApplicationCommandOptionType.String,
			choices: [
				{
					name: 'ping',
					value: 'ping'
				},
				{
					name: 'globalsync',
					value: 'globalsync'
				}
			],
			required: true
		}
	],
	run: async ({ user, options, client }: CommandRunOptions<{ command: 'ping' | 'globalsync' }>) => {
		if (options.command === 'ping') {
			return `${user.username}, Pong!`;
		}
		if (options.command === 'globalsync') {
			await bulkUpdateCommands({ client, commands: client.commands.values, guildID: null });
			return 'Updated all commands.';
		}
		return 'Invalid command.';
	}
};
