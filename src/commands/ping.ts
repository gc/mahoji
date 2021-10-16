import type { CommandRunOptions, ICommand } from '../lib/types';

export const command: ICommand = {
	name: 'ping',
	description: 'Ping, Pong!',
	options: [],
	run: async ({ interaction }: CommandRunOptions) => {
		return `${interaction.member?.user.username}, Pong!`;
	}
};
