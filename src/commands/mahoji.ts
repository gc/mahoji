import { ApplicationCommandOptionType } from 'discord-api-types/v9';

import type { ICommand } from '../lib/structures/ICommand';
import type { CommandRunOptions } from '../lib/types';
import { bulkUpdateCommands } from '../lib/util';

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
	run: async ({ interaction, options, client }: CommandRunOptions<{ command: 'ping' | 'globalsync' }>) => {
		if (options.command === 'ping') {
			return `${interaction.member?.user.username}, Pong!`;
		}
		if (options.command === 'globalsync') {
			await bulkUpdateCommands({ client, commands: client.commands.values, guildID: null });
			return 'Updated all commands.';
		}
		return 'Invalid command.';
	}
};
