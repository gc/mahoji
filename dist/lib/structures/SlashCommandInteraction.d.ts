import { InteractionType } from 'discord-api-types/payloads/v9';
import type { APIChatInputApplicationCommandInteraction, CommandOptions, ISlashCommandData, SlashCommandResponse } from '../types';
import type { ICommand } from './ICommand';
import { Interaction } from './Interaction';
import type { MahojiClient } from './Mahoji';
export declare class SlashCommandInteraction extends Interaction {
    options: CommandOptions;
    command: ICommand;
    deferred: boolean;
    type: InteractionType.ApplicationCommand;
    data: ISlashCommandData;
    constructor(interaction: APIChatInputApplicationCommandInteraction, client: MahojiClient);
    deferReply(options?: {
        ephemeral?: boolean;
    }): Promise<void>;
    respond({ response }: SlashCommandResponse): Promise<void>;
}
//# sourceMappingURL=SlashCommandInteraction.d.ts.map