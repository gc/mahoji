import type { APIApplicationCommandAutocompleteInteraction } from 'discord-api-types/payloads/v9/_interactions/autocomplete';
import type { APIApplicationCommandAutocompleteResponse, APIApplicationCommandInteraction, APIApplicationCommandOptionChoice, APIChatInputApplicationCommandInteraction, APIInteractionDataResolvedChannel, APIInteractionDataResolvedGuildMember, APIInteractionGuildMember, APIInteractionResponsePong, APIMessage, APIPingInteraction, APIRole, APIUser, ApplicationCommandOptionType, InteractionType, Snowflake } from 'discord-api-types/v9';
import type { MahojiClient } from '..';
import type { InteractionResponseWithBufferAttachments } from './structures/ICommand';
import type { Interaction } from './structures/Interaction';
import type { SlashCommandInteraction } from './structures/SlashCommandInteraction';
export type { APIApplicationCommandOption, APIChatInputApplicationCommandInteraction } from 'discord-api-types/v9';
export declare type CommandOption = {
    name: string;
    description: string;
    required?: boolean;
} & ({
    type: ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup;
    options?: CommandOption[];
} | {
    type: ApplicationCommandOptionType.String;
    choices?: {
        name: string;
        value: string;
    }[];
    autocomplete?: (value: string, member: APIInteractionGuildMember) => Promise<APIApplicationCommandOptionChoice[]>;
} | {
    type: ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number;
    choices?: {
        name: string;
        value: number;
    }[];
    autocomplete?: (value: number, member: APIInteractionGuildMember) => Promise<APIApplicationCommandOptionChoice[]>;
    min_value?: number;
    max_value?: number;
} | {
    type: ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.User | ApplicationCommandOptionType.Channel | ApplicationCommandOptionType.Role | ApplicationCommandOptionType.Mentionable;
});
declare type MahojiCommandOption = number | string | {
    user: APIUser;
    member: APIInteractionDataResolvedGuildMember;
} | APIInteractionDataResolvedChannel | APIRole | boolean;
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
interface BaseInteractionResponse {
    type: InteractionType;
    interaction: SlashCommandInteraction | Interaction | null;
    response: InteractionResponseWithBufferAttachments | APIApplicationCommandAutocompleteResponse | APIInteractionResponsePong;
}
export interface SlashCommandResponse extends BaseInteractionResponse {
    response: InteractionResponseWithBufferAttachments;
    interaction: SlashCommandInteraction;
    type: APIChatInputApplicationCommandInteraction['type'];
}
export interface SlashCommandAutocompleteResponse extends BaseInteractionResponse {
    response: APIApplicationCommandAutocompleteResponse;
    interaction: Interaction;
    type: APIApplicationCommandAutocompleteInteraction['type'];
}
export interface PongResponse extends BaseInteractionResponse {
    response: APIInteractionResponsePong;
    interaction: null;
    type: APIPingInteraction['type'];
}
export interface ISlashCommandData {
    type: APIChatInputApplicationCommandInteraction['type'];
    interaction: APIApplicationCommandInteraction;
    response: SlashCommandResponse | null;
}
interface IAutocompleteData {
    type: APIApplicationCommandAutocompleteInteraction['type'];
    interaction: APIApplicationCommandAutocompleteInteraction;
    response: SlashCommandAutocompleteResponse | null;
}
interface IPingData {
    type: APIPingInteraction['type'];
    interaction: APIPingInteraction;
    response: PongResponse | null;
}
export interface IInteraction {
    id: Snowflake;
    applicationID: Snowflake;
    token: string;
    client: MahojiClient;
    message?: APIMessage;
    channelID: bigint;
    guildID: bigint;
    userID: bigint;
    member: APIInteractionGuildMember;
    user: APIUser;
    data: ISlashCommandData | IAutocompleteData | IPingData;
}
export declare type InteractionResponse = NonNullable<IInteraction['data']['response']>;
export declare type InteractionErrorResponse = {
    error: Error;
} & ({
    interaction: SlashCommandInteraction;
    type: InteractionType.ApplicationCommand;
} | {
    interaction: Interaction;
    type: InteractionType.ApplicationCommandAutocomplete | InteractionType.MessageComponent | InteractionType.Ping;
});
//# sourceMappingURL=types.d.ts.map