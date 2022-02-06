import { REST } from '@discordjs/rest';
import { APIInteraction } from 'discord-api-types/v9';
import type { Adapter, InteractionErrorResponse, InteractionResponse } from '../types';
import type { ICommand, InteractionResponseWithBufferAttachments } from './ICommand';
import { SlashCommandInteraction } from './SlashCommandInteraction';
import { Store } from './Store';
interface MahojiOptions {
    discordToken: string;
    developmentServerID: string;
    applicationID: string;
    storeDirs?: string[];
    handlers?: Handlers;
}
export declare const defaultMahojiOptions: {
    readonly discordPublicKey: "";
    readonly discordToken: "";
    readonly developmentServer: "";
};
export interface Handlers {
    preCommand?: (options: {
        command: ICommand;
        interaction: SlashCommandInteraction;
    }) => Promise<string | undefined>;
    postCommand?: (options: {
        command: ICommand;
        interaction: SlashCommandInteraction;
        error: Error | null;
        response: InteractionResponseWithBufferAttachments | null;
    }) => Promise<string | undefined>;
}
export declare class MahojiClient {
    commands: Store<ICommand>;
    token: string;
    developmentServerID: string;
    applicationID: string;
    storeDirs: string[];
    restManager: REST;
    adapters: Adapter[];
    handlers: Handlers;
    constructor(options: MahojiOptions);
    parseInteraction(interaction: APIInteraction): Promise<InteractionResponse | InteractionErrorResponse | null>;
    start(): Promise<void>;
    loadStores(): Promise<void>;
    updateCommands(): Promise<void>;
}
export {};
//# sourceMappingURL=Mahoji.d.ts.map