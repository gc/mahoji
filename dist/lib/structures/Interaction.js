"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interaction = void 0;
const v9_1 = require("discord-api-types/v9");
class Interaction {
    constructor(interaction, client) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "applicationID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "token", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "channelID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "guildID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userID", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "member", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.id = interaction.id;
        this.token = interaction.token;
        if (!interaction.guild_id ||
            !interaction.channel_id ||
            !interaction.member?.user.id ||
            !interaction.member ||
            !interaction.member.user) {
            throw new Error('Missing essential properties for base Interaction.');
        }
        this.client = client;
        this.guildID = BigInt(interaction.guild_id);
        this.channelID = BigInt(interaction.channel_id);
        this.userID = BigInt(interaction.member.user.id);
        this.applicationID = interaction.application_id;
        this.member = interaction.member;
        this.user = interaction.member.user;
        this.message = interaction.message;
        // @ts-ignore TODO
        this.data = {
            interaction,
            type: interaction.type,
            response: null
        };
    }
    async respond(result) {
        const route = v9_1.Routes.interactionCallback(this.data.interaction.id, this.data.interaction.token);
        if (result.type === 2 /* ApplicationCommand */) {
            const files = result.response.data && 'attachments' in result.response.data
                ? result.response.data.attachments?.map(a => ({
                    fileName: a.fileName,
                    fileData: a.buffer
                }))
                : undefined;
            delete result.response.data?.attachments;
            await this.client.restManager.post(route, {
                body: {
                    ...result.response
                },
                files
            });
            return;
        }
        await this.client.restManager.post(route, { body: result.response });
    }
}
exports.Interaction = Interaction;
//# sourceMappingURL=Interaction.js.map