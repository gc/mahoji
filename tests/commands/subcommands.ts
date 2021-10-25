import { ApplicationCommandOptionType } from '../../src';
import type { CommandRunOptions, ICommand } from '../../src/lib/types';

export const modActionsCommand: ICommand = {
	name: 'modactions',
	description: 'Perform mod actions on a user.',
	options: [
		{
			name: 'kick',
			description: 'Get or edit permissions for a user',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: 'get',
					description: 'Get permissions for a user',
					type: 1, // 1 is type SUB_COMMAND
					options: [
						{
							name: 'user',
							description: 'The user to get',
							type: 6, // 6 is type USER
							required: true
						}
					]
				}
			]
		},
		{
			name: 'ban',
			description: 'Get or edit permissions for a role',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: 'user',
					description: 'The user to bane',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'user',
							description: 'The user to ban',
							type: ApplicationCommandOptionType.User,
							required: true
						}
					]
				}
			]
		}
	],
	run: async ({ interaction, options }: CommandRunOptions<{ name?: string; quantity?: number }>) => {
		console.log(options);
		return `${options.name ? options.name : interaction.member!.user.username}, Pong!`.repeat(
			options.quantity ?? 1
		);
	}
};
