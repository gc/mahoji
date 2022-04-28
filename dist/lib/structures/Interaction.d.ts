import { APIInteractionGuildMember, APIMessage, APIUser } from 'discord-api-types/v9';
import type { IInteraction, InteractionResponse } from '../types';
import type { MahojiClient } from './Mahoji';
export declare class Interaction implements IInteraction {
    id: string;
    applicationID: string;
    token: string;
    client: MahojiClient;
    message?: APIMessage | undefined;
    channelID: bigint;
    guildID?: bigint;
    userID: bigint;
    member?: APIInteractionGuildMember;
    user: APIUser;
    data: IInteraction['data'];
    constructor(interaction: IInteraction['data']['interaction'], client: MahojiClient);
    respond(result: InteractionResponse): Promise<void>;
}
//# sourceMappingURL=Interaction.d.ts.map