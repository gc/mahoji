"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MahojiClient = exports.defaultMahojiOptions = void 0;
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const path_1 = require("path");
const util_1 = require("../util");
const Interaction_1 = require("./Interaction");
const SlashCommandInteraction_1 = require("./SlashCommandInteraction");
const Store_1 = require("./Store");
exports.defaultMahojiOptions = {
    discordPublicKey: '',
    discordToken: '',
    developmentServer: ''
};
class MahojiClient {
    constructor(options) {
        Object.defineProperty(this, "commands", {
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
        Object.defineProperty(this, "developmentServerID", {
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
        Object.defineProperty(this, "storeDirs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "restManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "adapters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.token = options.discordToken;
        this.developmentServerID = options.developmentServerID;
        this.applicationID = options.applicationID;
        this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), (0, path_1.join)('node_modules', 'mahoji', 'dist')];
        this.commands = new Store_1.Store({ name: 'commands', dirs: this.storeDirs, checker: util_1.isValidCommand });
        this.restManager = new rest_1.REST({ version: '9' }).setToken(this.token);
        this.handlers = options.handlers ?? {};
    }
    async parseInteraction(interaction) {
        if (interaction.type === 1 /* Ping */) {
            return { response: { type: 1 }, interaction: null, type: 1 /* Ping */ };
        }
        const user = interaction.member?.user ?? interaction.user;
        if (!user) {
            return null;
        }
        if (interaction.type === 4 /* ApplicationCommandAutocomplete */) {
            const { data } = interaction;
            if (!data)
                return (0, util_1.autocompleteResult)(interaction, this, []);
            const { options } = data;
            const command = this.commands.pieces.get(data.name);
            return {
                response: {
                    type: 8 /* ApplicationCommandAutocompleteResult */,
                    data: {
                        choices: await (0, util_1.handleAutocomplete)(command, options, user, interaction.member)
                    }
                },
                interaction: new Interaction_1.Interaction(interaction, this),
                type: 4 /* ApplicationCommandAutocomplete */
            };
        }
        if (interaction.type === 2 /* ApplicationCommand */) {
            const command = this.commands.pieces.get(interaction.data.name);
            if (!command)
                return null;
            const slashCommandInteraction = new SlashCommandInteraction_1.SlashCommandInteraction(interaction, this);
            // Permissions
            if (slashCommandInteraction.command.requiredPermissions) {
                if (!slashCommandInteraction.member)
                    return null;
                for (const perm of slashCommandInteraction.command.requiredPermissions) {
                    if (!(0, util_1.bitFieldHasBit)(slashCommandInteraction.member.permissions, v9_1.PermissionFlagsBits[perm])) {
                        return {
                            response: {
                                data: {
                                    content: "You don't have permission to use this command.",
                                    flags: 64 /* Ephemeral */
                                },
                                type: 4 /* ChannelMessageWithSource */
                            },
                            interaction: slashCommandInteraction,
                            type: 2 /* ApplicationCommand */
                        };
                    }
                }
            }
            let error = null;
            let response = null;
            let inhibited = false;
            try {
                const inhibitedResponse = await this.handlers.preCommand?.({
                    command: slashCommandInteraction.command,
                    interaction: slashCommandInteraction
                });
                if (inhibitedResponse) {
                    inhibited = true;
                    return {
                        response: {
                            data: {
                                content: inhibitedResponse,
                                flags: 64 /* Ephemeral */
                            },
                            type: 4 /* ChannelMessageWithSource */
                        },
                        interaction: slashCommandInteraction,
                        type: 2 /* ApplicationCommand */
                    };
                }
                const rawResponse = await slashCommandInteraction.command.run({
                    interaction: slashCommandInteraction,
                    options: slashCommandInteraction.options,
                    client: this,
                    user: slashCommandInteraction.user,
                    member: slashCommandInteraction.member,
                    channelID: slashCommandInteraction.channelID,
                    guildID: slashCommandInteraction.guildID,
                    userID: slashCommandInteraction.userID
                });
                response =
                    rawResponse === null
                        ? slashCommandInteraction.data.response?.response ?? null
                        : typeof rawResponse === 'string'
                            ? { data: { content: rawResponse }, type: 4 /* ChannelMessageWithSource */ }
                            : { data: { ...rawResponse }, type: 4 /* ChannelMessageWithSource */ };
                if (!response)
                    return null;
                return {
                    response,
                    interaction: slashCommandInteraction,
                    type: 2 /* ApplicationCommand */
                };
            }
            catch (err) {
                if (!(err instanceof Error))
                    console.error('Received an error that isnt an Error.');
                error = err;
                if (error) {
                    return { error, interaction: slashCommandInteraction, type: 2 /* ApplicationCommand */ };
                }
            }
            finally {
                await this.handlers.postCommand?.({
                    command: slashCommandInteraction.command,
                    interaction: slashCommandInteraction,
                    error,
                    response,
                    inhibited
                });
            }
        }
        return null;
    }
    async start() {
        await this.loadStores();
        await Promise.all(this.adapters.map(adapter => adapter.init()));
    }
    async loadStores() {
        await Promise.all([this.commands].map(store => store.load()));
        await this.updateCommands();
    }
    async updateCommands() {
        const liveCommands = (await this.restManager.get(v9_1.Routes.applicationGuildCommands(this.applicationID, this.developmentServerID)));
        const changedCommands = [];
        // Find commands that don't match their previous values
        for (const currentCommand of this.commands.values) {
            const liveCmd = liveCommands.find(c => c.name === currentCommand.name);
            if (!liveCmd) {
                changedCommands.push(currentCommand);
                continue;
            }
            if (currentCommand.description !== liveCmd.description) {
                changedCommands.push(currentCommand);
                continue;
            }
            const currentOptions = currentCommand.options.map(util_1.convertCommandOptionToAPIOption);
            const liveOptions = liveCmd.options;
            for (let i = 0; i < currentOptions.length; i++) {
                const liveOpt = liveOptions?.[i];
                const match = liveOpt && (0, util_1.commandOptionMatches)(liveOpt, currentOptions[i]);
                if (match && !match.matches) {
                    changedCommands.push(currentCommand);
                }
            }
        }
        // If more than 3 commands need to be updated, bulk update ALL of them.
        // Otherwise, just individually update the changed command(s)
        if (changedCommands.length > 3) {
            (0, util_1.bulkUpdateCommands)({ client: this, commands: this.commands.values, guildID: this.developmentServerID });
        }
        else {
            changedCommands.map(command => (0, util_1.updateCommand)({ client: this, command, guildID: this.developmentServerID }));
        }
    }
}
exports.MahojiClient = MahojiClient;
//# sourceMappingURL=Mahoji.js.map