import { ApplicationCommandOptionType } from '../../src';
import type { ICommand } from '../../src/lib/structures/ICommand';
import type { CommandRunOptions } from '../../src/lib/types';

export const command: ICommand = {
	name: 'ping',
	description: 'Ping! Pong!',
	options: [
		{
			name: 'name',
			description: 'The custom name you want to ping.',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'quantity',
			description: 'The amount of times to ping.',
			type: ApplicationCommandOptionType.Number,
			required: false
		}
	],
	requiredPermissions: ['AddReactions'],
	run: async ({ options, user }: CommandRunOptions<{ name?: string; quantity?: number }>) => {
		return {
			content: `${options.name ? options.name : user.username}, Pong!`.repeat(options.quantity ?? 1)
		};
	}
};
