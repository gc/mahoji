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
	RESTPostAPIApplicationGuildCommandsJSONBody
} from 'discord-api-types/v9';
import fetch from 'node-fetch';

import type { CachedCommand, CommandOptions, ICommand } from '../lib/types';
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

export function convertCommandToCachedCommand(c: ICommand): CachedCommand {
	return {
		options: JSON.stringify(c.options),
		name: c.name,
		description: c.description
	};
}

export function cachedCommandsAreEqual(previousC: CachedCommand, newC: CachedCommand) {
	return (
		newC.name === previousC.name && newC.description === previousC.description && newC.options === previousC.options
	);
}

export function convertCommandToAPICommand(cmd: ICommand): RESTPostAPIApplicationGuildCommandsJSONBody {
	return {
		name: cmd.name,
		description: cmd.description,
		options: [...cmd.options]
	};
}

function baseHeaders(client: MahojiClient) {
	return {
		Authorization: `Bot ${client.token}`,
		'Content-Type': 'application/json'
	};
}

function getCommandsEndpoint({ client, isGlobal }: { client: MahojiClient; isGlobal: boolean }) {
	return isGlobal
		? `${client.discordBaseURL}/applications/${client.applicationID}/${client.developmentServerID}/commands`
		: `${client.discordBaseURL}/applications/${client.applicationID}/guilds/${client.developmentServerID}/commands`;
}

/**
 * Submits ALL commands to the Discord API to be updated/synced, so they're all available to use.
 */
export async function bulkUpdateCommands({
	client,
	commands,
	isGlobal
}: {
	client: MahojiClient;
	commands: ICommand[];
	isGlobal: boolean;
}) {
	const apiCommands = commands.map(convertCommandToAPICommand);

	const result = await fetch(getCommandsEndpoint({ client, isGlobal }), {
		method: 'PUT',
		body: JSON.stringify(apiCommands),
		headers: {
			...baseHeaders(client)
		}
	});

	return result;
}

/**
 * Submits a command to the Discord API to be updated/synced, so it's available to use.
 */
export async function updateCommand({
	client,
	command,
	isGlobal
}: {
	client: MahojiClient;
	command: ICommand;
	isGlobal: boolean;
}) {
	const apiCommand = convertCommandToAPICommand(command);

	const result = await fetch(getCommandsEndpoint({ client, isGlobal }), {
		method: 'POST',
		body: JSON.stringify(apiCommand),
		headers: {
			...baseHeaders(client)
		}
	});

	return result;
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
