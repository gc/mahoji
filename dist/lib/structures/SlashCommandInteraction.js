"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandInteraction = void 0;
require("discord-api-types/payloads/v9");
const v9_1 = require("discord-api-types/rest/v9");
const util_1 = require("../util");
const Interaction_1 = require("./Interaction");
class SlashCommandInteraction extends Interaction_1.Interaction {
    constructor(interaction, client) {
        super(interaction, client);
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "command", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deferred", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2 /* ApplicationCommand */
        });
        this.options = (0, util_1.convertAPIOptionsToCommandOptions)(interaction.data.options, interaction.data.resolved);
        const command = client.commands.pieces.get(interaction.data.name);
        if (!command) {
            throw new Error(`'${interaction.data.name}' command does not exist.`);
        }
        this.command = command;
    }
    async deferReply(options) {
        this.deferred = true;
        await this.client.restManager.post(v9_1.Routes.interactionCallback(this.id, this.token), {
            body: {
                type: 5 /* DeferredChannelMessageWithSource */,
                data: {
                    flags: options?.ephemeral ? 64 /* Ephemeral */ : undefined
                }
            }
        });
    }
    async respond({ response }) {
        // If this response is for a deferred interaction, we have to use a different route/method/body.
        if (this.deferred) {
            await this.client.restManager.patch(v9_1.Routes.webhookMessage(this.client.applicationID, this.data.interaction.token), {
                body: { ...response.data, attachments: undefined },
                files: response.data && 'attachments' in response.data
                    ? response.data.attachments?.map(a => ({
                        fileName: a.fileName,
                        fileData: a.buffer
                    }))
                    : undefined
            });
            return;
        }
        super.respond({ response, interaction: this, type: 2 /* ApplicationCommand */ });
    }
}
exports.SlashCommandInteraction = SlashCommandInteraction;
//# sourceMappingURL=SlashCommandInteraction.js.map