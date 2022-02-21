import { ApplicationCommandOptionType } from '../../src';
import type { ICommand } from '../../src/lib/structures/ICommand';
import type { CommandRunOptions } from '../../src/lib/types';

export const modActionsCommand: ICommand = {
	name: 'modactions',
	description: 'Perform mod actions on a user.',
	options: [
		{
			name: 'kick',
			description: 'Get ofr edit permissions for a user',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: 'get',
					description: 'Get permissions for a user',
					type: 1,
					options: [
						{
							name: 'user',
							description: 'The user to get',
							type: 6,
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
						},
						{
							name: 'channel',
							description: 'Get or edit permissions for a role',
							type: ApplicationCommandOptionType.Channel,
							required: true
						},
						{
							name: 'role',
							description: 'Get or edit permissions for a role',
							type: ApplicationCommandOptionType.Role,
							required: true
						},
						{
							name: 'mentionable',
							description: 'Mentionable',
							type: ApplicationCommandOptionType.Mentionable,
							required: true
						}
					]
				}
			]
		}
	],
	run: async ({ user, options }: CommandRunOptions<{ name?: string; quantity?: number }>) => {
		return `${options.name ? options.name : user.username}, Pong!`.repeat(options.quantity ?? 1);
	}
};
