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
				},
				{
					name: 'globalsync',
					value: 'globalsync'
				}
			],
			required: true
		},
		{
			name: 'value',
			description: "The value for the command you're invoking.",
			type: ApplicationCommandOptionType.Number,
			required: false
		}
	],
	run: async ({ interaction, options }: CommandRunOptions<{ command: 'ping' | 'globalsync' }>) => {
		// / console.log(JSON.stringify(interaction, null, 4));
		console.log(options);
		return `${interaction.member?.user.username}, Pong!`;
	}
};
