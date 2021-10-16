import { isFunction } from '@sapphire/utilities';
import crypto from 'crypto';
import type { RESTPostAPIApplicationGuildCommandsJSONBody } from 'discord-api-types';
import fetch from 'node-fetch';

import type { CachedCommand, ICommand } from '../lib/types';
import type { MahojiClient } from './structures/Mahoji';

export function sha256Hash(x: string) {
	return crypto.createHash('sha256').update(x, 'utf8').digest('hex');
}

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
		data.description.length > 32
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
		options: sha256Hash(JSON.stringify(c.options)),
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

export async function bulkUpdateCommands(client: MahojiClient, commands: ICommand[]) {
	const apiCommands = commands.map(convertCommandToAPICommand);

	const result = await fetch(
		`${client.discordBaseURL}/applications/${client.applicationID}/guilds/${client.developmentServerID}/commands`,
		{
			method: 'PUT',
			body: JSON.stringify(apiCommands),
			headers: {
				Authorization: `Bot ${client.token}`,
				'Content-Type': 'application/json'
			}
		}
	);

	return result;
}

export async function updateCommand(client: MahojiClient, command: ICommand) {
	const apiCommand = convertCommandToAPICommand(command);

	const result = await fetch(
		`${client.discordBaseURL}/applications/${client.applicationID}/guilds/${client.developmentServerID}/commands`,
		{
			method: 'POST',
			body: JSON.stringify(apiCommand),
			headers: {
				Authorization: `Bot ${client.token}`,
				'Content-Type': 'application/json'
			}
		}
	);

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
