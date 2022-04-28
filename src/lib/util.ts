import crypto from 'crypto';
import type { APIApplicationCommandAutocompleteInteraction } from 'discord-api-types/payloads/v9/_interactions/autocomplete';
import {
	APIApplicationCommandInteractionDataOption,
	APIApplicationCommandOption,
	APIApplicationCommandOptionChoice,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionDataResolved,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIInteractionGuildMember,
	APIInteractionResponseCallbackData,
	APIRole,
	APIUser,
	ApplicationCommandOptionType,
	InteractionResponseType,
	InteractionType,
	RESTPostAPIApplicationGuildCommandsJSONBody,
	Routes,
	Snowflake
} from 'discord-api-types/v9';
import FormData from 'form-data';

import type { CommandOption, CommandOptions, InteractionResponse } from '../lib/types';
import type { ICommand, InteractionResponseWithBufferAttachments } from './structures/ICommand';
import { Interaction } from './structures/Interaction';
import type { MahojiClient } from './structures/Mahoji';

export type CryptoKey = any;
export type WebCrypto = any;
export const webcrypto = crypto.webcrypto as WebCrypto;

export function isValidCommand(data: any): data is ICommand {
	if (!isValidPiece(data)) return false;
	if (!data.name || typeof data.name !== 'string' || data.name.length < 1 || data.name.length > 32) {
		return false;
	}
	if (
		!data.description ||
		typeof data.description !== 'string' ||
		data.description.length < 1 ||
		data.description.length > 100
	) {
		return false;
	}
	if (typeof data.run !== 'function') return false;
	return true;
}

export function isValidPiece(data: any) {
	if (!data || !data.name) return false;
	return true;
}

export function commandOptionMatches(
	optionX: APIApplicationCommandOption,
	optionY: APIApplicationCommandOption
): { matches: true } | { matches: false; changedField: string } {
	if (optionX.type !== optionY.type) return { matches: false, changedField: 'type' };
	if (optionX.name !== optionY.name) return { matches: false, changedField: 'name' };
	if (optionX.description !== optionY.description) return { matches: false, changedField: 'description' };
	if ((optionX.required || false) !== (optionY.required || false))
		return { matches: false, changedField: 'required' };
	if (
		('autocomplete' in optionX ? optionX.autocomplete || false : false) !==
		('autocomplete' in optionY ? optionY.autocomplete || false : false)
	) {
		return { matches: false, changedField: 'autocomplete' };
	}
	if (
		(optionX.type === ApplicationCommandOptionType.Subcommand &&
			optionY.type === ApplicationCommandOptionType.Subcommand) ||
		(optionX.type === ApplicationCommandOptionType.SubcommandGroup &&
			optionY.type === ApplicationCommandOptionType.SubcommandGroup)
	) {
		if (
			optionX.options?.length !== optionY.options?.length &&
			((optionX.options?.length ?? 0) > 0 || (optionY.options?.length ?? 0) > 0)
		) {
			return {
				matches: false,
				changedField: `length of options (${optionX.options?.length},${optionY.options?.length})`
			};
		}

		const notMatchingResult = optionX.options
			?.map((opt, index) =>
				commandOptionMatches(opt, optionY.options === undefined ? opt : optionY.options[index])
			)
			.find(res => !res.matches);
		return notMatchingResult || { matches: true };
	}

	return { matches: true };
}

export function convertCommandOptionToAPIOption(option: CommandOption): APIApplicationCommandOption {
	switch (option.type) {
		case ApplicationCommandOptionType.Number:
		case ApplicationCommandOptionType.Integer:
		case ApplicationCommandOptionType.String: {
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
				options:
					'options' in option && option.options ? option.options.map(convertCommandOptionToAPIOption) : []
			};
		}
	}
}

export function convertCommandToAPICommand(cmd: ICommand): RESTPostAPIApplicationGuildCommandsJSONBody {
	return {
		name: cmd.name,
		description: cmd.description,
		options: cmd.options.map(convertCommandOptionToAPIOption)
	};
}

export async function bulkUpdateCommands({
	client,
	commands,
	guildID
}: {
	client: MahojiClient;
	commands: ICommand[];
	guildID: Snowflake | null;
}) {
	const apiCommands = commands.map(convertCommandToAPICommand);

	const route =
		guildID === null
			? Routes.applicationCommands(client.applicationID)
			: Routes.applicationGuildCommands(client.applicationID, guildID);

	return client.restManager.put(route, {
		body: apiCommands
	});
}

export async function updateCommand({
	client,
	command,
	guildID
}: {
	client: MahojiClient;
	command: ICommand;
	guildID: Snowflake | null;
}) {
	const apiCommand = convertCommandToAPICommand(command);
	const route =
		guildID === null
			? Routes.applicationCommands(client.applicationID)
			: Routes.applicationGuildCommands(client.applicationID, guildID);
	return client.restManager.post(route, {
		body: apiCommand
	});
}

export const enum Time {
	Millisecond = 1,
	Second = 1000,
	Minute = 1000 * 60,
	Hour = 1000 * 60 * 60,
	Day = 1000 * 60 * 60 * 24,
	Month = 1000 * 60 * 60 * 24 * 30,
	Year = 1000 * 60 * 60 * 24 * 365
}

export function convertAPIOptionsToCommandOptions(
	options: APIChatInputApplicationCommandInteraction['data']['options'],
	resolvedObjects: APIChatInputApplicationCommandInteractionDataResolved | undefined
): CommandOptions {
	if (!options) return {};

	let parsedOptions: CommandOptions = {};

	for (const opt of options) {
		if (
			opt.type === ApplicationCommandOptionType.SubcommandGroup ||
			opt.type === ApplicationCommandOptionType.Subcommand
		) {
			let opts: CommandOptions = {};
			for (const [key, value] of Object.entries(
				convertAPIOptionsToCommandOptions(opt.options ?? [], resolvedObjects)
			)) {
				opts[key] = value;
			}
			parsedOptions[opt.name] = opts;
		} else if (opt.type === ApplicationCommandOptionType.Channel) {
			parsedOptions[opt.name] = resolvedObjects?.channels?.[opt.value] as APIInteractionDataResolvedChannel;
		} else if (opt.type === ApplicationCommandOptionType.Role) {
			parsedOptions[opt.name] = resolvedObjects?.roles?.[opt.value] as APIRole;
		} else if (opt.type === ApplicationCommandOptionType.User) {
			parsedOptions[opt.name] = {
				user: resolvedObjects?.users?.[opt.value] as APIUser,
				member: resolvedObjects?.members?.[opt.value] as APIInteractionDataResolvedGuildMember
			};
		} else {
			parsedOptions[opt.name] = opt.value;
		}
	}

	return parsedOptions;
}

export const autocompleteResult = (
	interaction: APIApplicationCommandAutocompleteInteraction,
	client: MahojiClient,
	options: APIApplicationCommandOptionChoice[]
): InteractionResponse => ({
	response: {
		type: InteractionResponseType.ApplicationCommandAutocompleteResult,
		data: {
			choices: options
		}
	},
	interaction: new Interaction(interaction, client),
	type: InteractionType.ApplicationCommandAutocomplete
});

export async function handleAutocomplete(
	command: ICommand | undefined,
	autocompleteData: APIApplicationCommandInteractionDataOption[] | undefined,
	user: APIUser,
	member?: APIInteractionGuildMember,
	option?: CommandOption
): Promise<APIApplicationCommandOptionChoice[]> {
	if (!command || !autocompleteData) return [];
	const data = autocompleteData.find(i => 'focused' in i && i.focused === true) ?? autocompleteData[0];

	if (data.type === ApplicationCommandOptionType.SubcommandGroup) {
		const group = command.options.find(c => c.name === data.name);
		if (group?.type !== ApplicationCommandOptionType.SubcommandGroup) return [];
		const subCommand = group.options?.find(
			c => c.name === data.options[0].name && c.type === ApplicationCommandOptionType.Subcommand
		);
		if (
			!subCommand ||
			!data.options ||
			!data.options[0] ||
			subCommand.type !== ApplicationCommandOptionType.Subcommand
		) {
			return [];
		}
		const option = data.options[0].options?.find(t => (t as any).focused);
		if (!option) return [];
		const subSubCommand = subCommand.options?.find(o => o.name === option.name);
		return handleAutocomplete(command, [option], user, member, subSubCommand);
	}
	if (data.type === ApplicationCommandOptionType.Subcommand) {
		if (!data.options || !data.options[0]) return [];
		const subCommand = command.options.find(c => c.name === data.name);
		if (subCommand?.type !== ApplicationCommandOptionType.Subcommand) return [];
		const subOption = subCommand.options?.find(c => c.name === data.options?.[0].name);
		if (!subOption) return [];
		return handleAutocomplete(command, [data.options[0]], user, member, subOption);
	}

	const optionBeingAutocompleted = option ?? command.options.find(o => o.name === autocompleteData[0].name);

	if (
		optionBeingAutocompleted &&
		'autocomplete' in optionBeingAutocompleted &&
		optionBeingAutocompleted.autocomplete !== undefined
	) {
		const autocompleteResult = await optionBeingAutocompleted.autocomplete(data.value as never, user, member);
		return autocompleteResult.slice(0, 25);
	}
	return [];
}

export function bitFieldHasBit(bitfield: string, bit: bigint) {
	return (BigInt(bitfield) & bit) === bit;
}

export function convertAttachments(data: InteractionResponseWithBufferAttachments): APIInteractionResponseCallbackData {
	return {
		...data,
		attachments: data.data?.attachments?.map((at, index) => ({
			id: index.toString(),
			filename: at.fileName,
			description: at.fileName
		}))
	};
}

export function handleFormData(response: InteractionResponse): InteractionResponse | FormData {
	if (
		response.response.type === InteractionResponseType.ApplicationCommandAutocompleteResult ||
		response.response.type === InteractionResponseType.Pong
	) {
		return response;
	}
	const attachments =
		response.response.data && 'attachments' in response.response.data && response.response.data.attachments;
	if (!attachments) return response;

	const finalBody = new FormData();

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

export const ERROR_RESPONSE: InteractionResponseWithBufferAttachments = {
	data: {
		content: 'There was an error running this command.'
	},
	type: InteractionResponseType.ChannelMessageWithSource
};
