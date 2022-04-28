/// <reference types="node" />
import type { APIInteractionResponseCallbackData, InteractionResponseType, PermissionFlagsBits } from 'discord-api-types/v9';
import type { CommandOption, CommandRunOptions, Piece } from '../types';
export interface InteractionResponseWithBufferAttachments {
    data?: InteractionResponseDataWithBufferAttachments;
    type: InteractionResponseType;
}
export interface MahojiAttachment {
    fileName: string;
    buffer: Buffer;
}
export declare type InteractionResponseDataWithBufferAttachments = {
    attachments?: MahojiAttachment[];
} & Omit<APIInteractionResponseCallbackData, 'attachments'>;
export declare type CommandResponse = Promise<string | InteractionResponseDataWithBufferAttachments>;
export declare type ICommand = Readonly<{
    description: string;
    options: CommandOption[];
    requiredPermissions?: (keyof typeof PermissionFlagsBits)[];
    run(options: CommandRunOptions): CommandResponse;
}> & Piece;
//# sourceMappingURL=ICommand.d.ts.map