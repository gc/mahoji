/// <reference types="node" />
import type { APIInteractionResponseCallbackData, InteractionResponseType, PermissionFlagsBits } from 'discord-api-types/v9';
import type { CommandOption, CommandRunOptions, Piece } from '../types';
export interface InteractionResponseWithBufferAttachments {
    data?: InteractionResponseDataWithBufferAttachments;
    type: InteractionResponseType;
}
export declare type InteractionResponseDataWithBufferAttachments = {
    attachments?: {
        fileName: string;
        buffer: Buffer;
    }[];
} & Omit<APIInteractionResponseCallbackData, 'attachments'>;
declare type CommandResponse = Promise<string | InteractionResponseDataWithBufferAttachments>;
export declare type ICommand = Readonly<{
    description: string;
    options: CommandOption[];
    requiredPermissions?: (keyof typeof PermissionFlagsBits)[];
    run(options: CommandRunOptions): CommandResponse;
}> & Piece;
export {};
//# sourceMappingURL=ICommand.d.ts.map