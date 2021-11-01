import type { APIInteractionResponseCallbackData, PermissionFlagsBits } from 'discord-api-types/v9';

import type { CommandOption, CommandRunOptions, Piece } from '../types';

export type ICommand = Readonly<{
	description: string;
	options: CommandOption[];
	requiredPermissions?: (keyof typeof PermissionFlagsBits)[];
	run(options: CommandRunOptions): Promise<string | APIInteractionResponseCallbackData>;
}> &
	Piece;
