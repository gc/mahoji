"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_RESPONSE = exports.handleFormData = exports.convertAttachments = exports.bitFieldHasBit = exports.handleAutocomplete = exports.autocompleteResult = exports.convertAPIOptionsToCommandOptions = exports.Time = exports.updateCommand = exports.bulkUpdateCommands = exports.convertCommandToAPICommand = exports.convertCommandOptionToAPIOption = exports.commandOptionMatches = exports.isValidPiece = exports.isValidCommand = exports.webcrypto = void 0;
const tslib_1 = require("tslib");
const crypto_1 = (0, tslib_1.__importDefault)(require("crypto"));
const v9_1 = require("discord-api-types/v9");
const form_data_1 = (0, tslib_1.__importDefault)(require("form-data"));
const Interaction_1 = require("./structures/Interaction");
exports.webcrypto = crypto_1.default.webcrypto;
function isValidCommand(data) {
    if (!isValidPiece(data))
        return false;
    if (!data.name || typeof data.name !== 'string' || data.name.length < 1 || data.name.length > 32) {
        return false;
    }
    if (!data.description ||
        typeof data.description !== 'string' ||
        data.description.length < 1 ||
        data.description.length > 100) {
        return false;
    }
    if (typeof data.run !== 'function')
        return false;
    return true;
}
exports.isValidCommand = isValidCommand;
function isValidPiece(data) {
    if (!data || !data.name)
        return false;
    return true;
}
exports.isValidPiece = isValidPiece;
function commandOptionMatches(optionX, optionY) {
    if (optionX.type !== optionY.type)
        return { matches: false, changedField: 'type' };
    if (optionX.name !== optionY.name)
        return { matches: false, changedField: 'name' };
    if (optionX.description !== optionY.description)
        return { matches: false, changedField: 'description' };
    if ((optionX.required || false) !== (optionY.required || false))
        return { matches: false, changedField: 'required' };
    if (('autocomplete' in optionX ? optionX.autocomplete || false : false) !==
        ('autocomplete' in optionY ? optionY.autocomplete || false : false)) {
        return { matches: false, changedField: 'autocomplete' };
    }
    if ((optionX.type === 1 /* Subcommand */ &&
        optionY.type === 1 /* Subcommand */) ||
        (optionX.type === 2 /* SubcommandGroup */ &&
            optionY.type === 2 /* SubcommandGroup */)) {
        if (optionX.options?.length !== optionY.options?.length &&
            ((optionX.options?.length ?? 0) > 0 || (optionY.options?.length ?? 0) > 0)) {
            return {
                matches: false,
                changedField: `length of options (${optionX.options?.length},${optionY.options?.length})`
            };
        }
        const notMatchingResult = optionX.options
            ?.map((opt, index) => commandOptionMatches(opt, optionY.options === undefined ? opt : optionY.options[index]))
            .find(res => !res.matches);
        return notMatchingResult || { matches: true };
    }
    return { matches: true };
}
exports.commandOptionMatches = commandOptionMatches;
function convertCommandOptionToAPIOption(option) {
    switch (option.type) {
        case 10 /* Number */:
        case 4 /* Integer */:
        case 3 /* String */: {
            return {
                ...option,
                autocomplete: 'autocomplete' in option ?? undefined
            };
        }
        default: {
            return {
                ...option,
                // TODO(gc): How the fuck do I fix this
                // @ts-ignore
                options: 'options' in option && option.options ? option.options.map(convertCommandOptionToAPIOption) : []
            };
        }
    }
}
exports.convertCommandOptionToAPIOption = convertCommandOptionToAPIOption;
function convertCommandToAPICommand(cmd) {
    return {
        name: cmd.name,
        description: cmd.description,
        options: cmd.options.map(convertCommandOptionToAPIOption)
    };
}
exports.convertCommandToAPICommand = convertCommandToAPICommand;
async function bulkUpdateCommands({ client, commands, guildID }) {
    const apiCommands = commands.map(convertCommandToAPICommand);
    const route = guildID === null
        ? v9_1.Routes.applicationCommands(client.applicationID)
        : v9_1.Routes.applicationGuildCommands(client.applicationID, guildID);
    return client.restManager.put(route, {
        body: apiCommands
    });
}
exports.bulkUpdateCommands = bulkUpdateCommands;
async function updateCommand({ client, command, guildID }) {
    const apiCommand = convertCommandToAPICommand(command);
    const route = guildID === null
        ? v9_1.Routes.applicationCommands(client.applicationID)
        : v9_1.Routes.applicationGuildCommands(client.applicationID, guildID);
    return client.restManager.post(route, {
        body: apiCommand
    });
}
exports.updateCommand = updateCommand;
var Time;
(function (Time) {
    Time[Time["Millisecond"] = 1] = "Millisecond";
    Time[Time["Second"] = 1000] = "Second";
    Time[Time["Minute"] = 60000] = "Minute";
    Time[Time["Hour"] = 3600000] = "Hour";
    Time[Time["Day"] = 86400000] = "Day";
    Time[Time["Month"] = 2592000000] = "Month";
    Time[Time["Year"] = 31536000000] = "Year";
})(Time = exports.Time || (exports.Time = {}));
function convertAPIOptionsToCommandOptions(options, resolvedObjects) {
    if (!options)
        return {};
    let parsedOptions = {};
    for (const opt of options) {
        if (opt.type === 2 /* SubcommandGroup */ ||
            opt.type === 1 /* Subcommand */) {
            let opts = {};
            for (const [key, value] of Object.entries(convertAPIOptionsToCommandOptions(opt.options ?? [], resolvedObjects))) {
                opts[key] = value;
            }
            parsedOptions[opt.name] = opts;
        }
        else if (opt.type === 7 /* Channel */) {
            parsedOptions[opt.name] = resolvedObjects?.channels?.[opt.value];
        }
        else if (opt.type === 8 /* Role */) {
            parsedOptions[opt.name] = resolvedObjects?.roles?.[opt.value];
        }
        else if (opt.type === 6 /* User */) {
            parsedOptions[opt.name] = {
                user: resolvedObjects?.users?.[opt.value],
                member: resolvedObjects?.members?.[opt.value]
            };
        }
        else {
            parsedOptions[opt.name] = opt.value;
        }
    }
    return parsedOptions;
}
exports.convertAPIOptionsToCommandOptions = convertAPIOptionsToCommandOptions;
const autocompleteResult = (interaction, client, options) => ({
    response: {
        type: 8 /* ApplicationCommandAutocompleteResult */,
        data: {
            choices: options
        }
    },
    interaction: new Interaction_1.Interaction(interaction, client),
    type: 4 /* ApplicationCommandAutocomplete */
});
exports.autocompleteResult = autocompleteResult;
async function handleAutocomplete(command, autocompleteData, user, member, option) {
    if (!command || !autocompleteData)
        return [];
    const data = autocompleteData.find(i => 'focused' in i && i.focused === true) ?? autocompleteData[0];
    if (data.type === 2 /* SubcommandGroup */) {
        const group = command.options.find(c => c.name === data.name);
        if (group?.type !== 2 /* SubcommandGroup */)
            return [];
        const subCommand = group.options?.find(c => c.name === data.options[0].name && c.type === 1 /* Subcommand */);
        if (!subCommand ||
            !data.options ||
            !data.options[0] ||
            subCommand.type !== 1 /* Subcommand */) {
            return [];
        }
        const option = data.options[0].options?.find(t => t.focused);
        if (!option)
            return [];
        const subSubCommand = subCommand.options?.find(o => o.name === option.name);
        return handleAutocomplete(command, [option], user, member, subSubCommand);
    }
    if (data.type === 1 /* Subcommand */) {
        if (!data.options || !data.options[0])
            return [];
        const subCommand = command.options.find(c => c.name === data.name);
        if (subCommand?.type !== 1 /* Subcommand */)
            return [];
        const subOption = subCommand.options?.find(c => c.name === data.options?.[0].name);
        if (!subOption)
            return [];
        return handleAutocomplete(command, [data.options[0]], user, member, subOption);
    }
    const optionBeingAutocompleted = option ?? command.options.find(o => o.name === autocompleteData[0].name);
    if (optionBeingAutocompleted &&
        'autocomplete' in optionBeingAutocompleted &&
        optionBeingAutocompleted.autocomplete !== undefined) {
        const autocompleteResult = await optionBeingAutocompleted.autocomplete(data.value, user, member);
        return autocompleteResult.slice(0, 25);
    }
    return [];
}
exports.handleAutocomplete = handleAutocomplete;
function bitFieldHasBit(bitfield, bit) {
    return (BigInt(bitfield) & bit) === bit;
}
exports.bitFieldHasBit = bitFieldHasBit;
function convertAttachments(data) {
    return {
        ...data,
        attachments: data.data?.attachments?.map((at, index) => ({
            id: index.toString(),
            filename: at.fileName,
            description: at.fileName
        }))
    };
}
exports.convertAttachments = convertAttachments;
function handleFormData(response) {
    if (response.response.type === 8 /* ApplicationCommandAutocompleteResult */ ||
        response.response.type === 1 /* Pong */) {
        return response;
    }
    const attachments = response.response.data && 'attachments' in response.response.data && response.response.data.attachments;
    if (!attachments)
        return response;
    const finalBody = new form_data_1.default();
    // Parse attachments
    if (attachments) {
        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            finalBody.append(`files[${i}]`, attachment.buffer, attachment.fileName);
        }
    }
    finalBody.append('payload_json', JSON.stringify(convertAttachments(response.response)));
    return finalBody;
}
exports.handleFormData = handleFormData;
exports.ERROR_RESPONSE = {
    data: {
        content: 'There was an error running this command.'
    },
    type: 4 /* ChannelMessageWithSource */
};
//# sourceMappingURL=util.js.map