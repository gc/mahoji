import type { CommandRunOptions, ICommand } from '../../src/lib/types';

export const command: ICommand = {
	name: 'testcmd',
	description: 'Ping! Pong!',
	options: [],
	run: async ({ interaction }: CommandRunOptions<{ test: string }>) => {
		return `Pong!!! ${interaction.type}`;
	}
};
