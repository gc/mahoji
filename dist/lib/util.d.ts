import type { APIApplicationCommandAutocompleteInteraction } from 'discord-api-types/payloads/v9/_interactions/autocomplete';
import { APIApplicationCommandInteractionDataOption, APIApplicationCommandOption, APIApplicationCommandOptionChoice, APIChatInputApplicationCommandInteraction, APIChatInputApplicationCommandInteractionDataResolved, APIInteractionGuildMember, APIInteractionResponseCallbackData, APIUser, RESTPostAPIApplicationGuildCommandsJSONBody, Snowflake } from 'discord-api-types/v9';
import FormData from 'form-data';
import type { CommandOption, CommandOptions, InteractionResponse } from '../lib/types';
import type { ICommand, InteractionResponseWithBufferAttachments } from './structures/ICommand';
import type { MahojiClient } from './structures/Mahoji';
export declare type CryptoKey = any;
export declare type WebCrypto = any;
export declare const webcrypto: any;
export declare function isValidCommand(data: any): data is ICommand;
export declare function isValidPiece(data: any): boolean;
export declare function commandOptionMatches(optionX: APIApplicationCommandOption, optionY: APIApplicationCommandOption): {
    matches: true;
} | {
    matches: false;
    changedField: string;
};
export declare function convertCommandOptionToAPIOption(option: CommandOption): APIApplicationCommandOption;
export declare function convertCommandToAPICommand(cmd: ICommand): RESTPostAPIApplicationGuildCommandsJSONBody;
export declare function bulkUpdateCommands({ client, commands, guildID }: {
    client: MahojiClient;
    commands: ICommand[];
    guildID: Snowflake | null;
}): Promise<unknown>;
export declare function updateCommand({ client, command, guildID }: {
    client: MahojiClient;
    command: ICommand;
    guildID: Snowflake | null;
}): Promise<unknown>;
export declare const enum Time {
    Millisecond = 1,
    Second = 1000,
    Minute = 60000,
    Hour = 3600000,
    Day = 86400000,
    Month = 2592000000,
    Year = 31536000000
}
export declare function convertAPIOptionsToCommandOptions(options: APIChatInputApplicationCommandInteraction['data']['options'], resolvedObjects: APIChatInputApplicationCommandInteractionDataResolved | undefined): CommandOptions;
export declare const autocompleteResult: (interaction: APIApplicationCommandAutocompleteInteraction, client: MahojiClient, options: APIApplicationCommandOptionChoice[]) => InteractionResponse;
export declare function handleAutocomplete(command: ICommand | undefined, autocompleteData: APIApplicationCommandInteractionDataOption[] | undefined, user: APIUser, member?: APIInteractionGuildMember, option?: CommandOption): Promise<APIApplicationCommandOptionChoice[]>;
export declare function bitFieldHasBit(bitfield: string, bit: bigint): boolean;
export declare function convertAttachments(data: InteractionResponseWithBufferAttachments): APIInteractionResponseCallbackData;
export declare function handleFormData(response: InteractionResponse): InteractionResponse | FormData;
export declare const ERROR_RESPONSE: InteractionResponseWithBufferAttachments;
//# sourceMappingURL=util.d.ts.map