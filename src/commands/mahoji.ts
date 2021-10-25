import { ApplicationCommandOptionType } from 'discord-api-types/v9';

import type { CommandRunOptions, ICommand } from '../lib/types';

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
				}
			],
			required: true
		}
	],
	run: async ({ interaction }: CommandRunOptions<{ command: 'ping' }>) => {
		return `${interaction.member?.user.username}, Pong!`;
	}
};
