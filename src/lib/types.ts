import type {
	APIApplicationCommandAutocompleteResponse,
	APIApplicationCommandOptionChoice,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIInteractionGuildMember,
	APIRole,
	APIUser,
	ApplicationCommandOptionType
} from 'discord-api-types/v9';

import type { MahojiClient } from '..';
import type { InteractionResponseWithBufferAttachments } from './structures/ICommand';
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
			autocomplete?: (
				value: string,
				member: APIInteractionGuildMember
			) => Promise<APIApplicationCommandOptionChoice[]>;
	  }
	| {
			type: ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number;
			choices?: { name: string; value: number }[];
			autocomplete?: (
				value: number,
				member: APIInteractionGuildMember
			) => Promise<APIApplicationCommandOptionChoice[]>;
			min_value?: number;
			max_value?: number;
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

type MahojiCommandOption =
	| number
	| string
	| { user: APIUser; member: APIInteractionDataResolvedGuildMember }
	| APIInteractionDataResolvedChannel
	| APIRole
	| boolean;

export interface CommandOptions {
	[key: string]: MahojiCommandOption | CommandOptions;
}

export interface CommandRunOptions<T extends CommandOptions = {}> {
	interaction: SlashCommandInteraction;
	options: T;
	client: MahojiClient;
	member: APIInteractionGuildMember;
	channelID: bigint;
	guildID: bigint;
	userID: bigint;
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

export interface AutocompleteData {
	type: number;
	name: string;
	value: string | number;
	focused: boolean;
}

export type InteractionResponse = InteractionResponseWithBufferAttachments | APIApplicationCommandAutocompleteResponse;
