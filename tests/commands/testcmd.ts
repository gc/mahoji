import { ApplicationCommandOptionType } from '../../src';
import type { CommandRunOptions, ICommand } from '../../src/lib/types';

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
	run: async ({ interaction, options }: CommandRunOptions<{ name?: string; quantity?: number }>) => {
		return {
			content: `${options.name ? options.name : interaction.member!.user.username}, Pong!`.repeat(
				options.quantity ?? 1
			)
		};
	}
};
