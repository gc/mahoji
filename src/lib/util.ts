import { isFunction } from '@sapphire/utilities';
import crypto from 'crypto';
import {
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionDataResolved,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIRole,
	APIUser,
	ApplicationCommandOptionType,
	RESTPostAPIApplicationGuildCommandsJSONBody,
	Routes,
	Snowflake
} from 'discord-api-types/v9';

import type { CommandOptions, ICommand } from '../lib/types';
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
	if (!isFunction(data.run)) return false;
	return true;
}

export function isValidPiece(data: any) {
	if (!data || !data.name) return false;
	return true;
}

export function convertCommandToAPICommand(cmd: ICommand): RESTPostAPIApplicationGuildCommandsJSONBody {
	return {
		name: cmd.name,
		description: cmd.description,
		options: [...cmd.options]
	};
}

/**
 * Submits ALL commands to the Discord API to be updated/synced, so they're all available to use.
 */
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

/**
 * Submits a command to the Discord API to be updated/synced, so it's available to use.
 */
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
			for (const [key, value] of Object.entries(
				convertAPIOptionsToCommandOptions(opt.options, resolvedObjects)
			)) {
				parsedOptions[key] = value;
			}
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
