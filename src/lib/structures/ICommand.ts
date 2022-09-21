import type { InteractionReplyOptions, PermissionFlagsBits } from 'discord.js';

import type { CommandOption, CommandRunOptions, Piece } from '../types';

export type CommandResponse = Promise<null | string | InteractionReplyOptions>;

export type ICommand = Readonly<{
	description: string;
	options: CommandOption[];
	requiredPermissions?: (keyof typeof PermissionFlagsBits)[];
	guildID?: string;
	run(options: CommandRunOptions): CommandResponse;
}> &
	Piece;
