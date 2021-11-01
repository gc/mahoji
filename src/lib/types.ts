import type {
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIRole,
	APIUser,
	ApplicationCommandOptionType
} from 'discord-api-types/v9';

import type { MahojiClient } from '..';
import type { SlashCommandInteraction } from './structures/SlashCommandInteraction';

export type { APIApplicationCommandOption, APIChatInputApplicationCommandInteraction } from 'discord-api-types/v9';

export type CommandOption = {
	name: string;
	description: string;
	required?: boolean;
} & (
	| {
			type: ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup;
			options?: CommandOption[];
	  }
	| {
			type: ApplicationCommandOptionType.String;
			choices?: { name: string; value: string }[];
	  }
	| {
			type: ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number;
			choices?: { name: string; value: number }[];
	  }
	| {
			type:
				| ApplicationCommandOptionType.Boolean
				| ApplicationCommandOptionType.User
				| ApplicationCommandOptionType.Channel
				| ApplicationCommandOptionType.Role
				| ApplicationCommandOptionType.Mentionable;
	  }
);

export type CommandOptions = Record<
	string,
	| number
	| string
	| { user: APIUser; member: APIInteractionDataResolvedGuildMember }
	| APIInteractionDataResolvedChannel
	| APIRole
	| boolean
>;

export interface CommandRunOptions<T extends CommandOptions = {}> {
	interaction: SlashCommandInteraction;
	options: T;
	client: MahojiClient;
}

export interface Piece {
	name: string;
}

export interface AdapterOptions {
	client: MahojiClient;
}

export interface Adapter {
	client: MahojiClient;
	init: () => Promise<unknown>;
}
