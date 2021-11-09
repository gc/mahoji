import { REST } from '@discordjs/rest';
import {
	APIApplicationCommand,
	APIApplicationCommandAutocompleteResponse,
	APIChatInputApplicationCommandInteraction,
	APIInteraction,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	PermissionFlagsBits,
	Routes
} from 'discord-api-types/v9';
import { join } from 'path';

import type { Adapter, AutocompleteData } from '../types';
import { autocompleteResult, bulkUpdateCommands, handleAutocomplete, isValidCommand, updateCommand } from '../util';
import type { ICommand, InteractionResponseWithBufferAttachments } from './ICommand';
import { SlashCommandInteraction } from './SlashCommandInteraction';
import { Store } from './Store';

interface MahojiOptions {
	discordToken: string;
	developmentServerID: string;
	applicationID: string;
	storeDirs?: string[];
}

export const defaultMahojiOptions = {
	discordPublicKey: '',
	discordToken: '',
	developmentServer: ''
} as const;

export class MahojiClient {
	commands: Store<ICommand>;
	token: string;
	developmentServerID: string;
	applicationID: string;
	storeDirs: string[];
	restManager: REST;
	adapters: Adapter[] = [];

	constructor(options: MahojiOptions) {
		this.token = options.discordToken;
		this.developmentServerID = options.developmentServerID;
		this.applicationID = options.applicationID;

		this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), join('node_modules', 'mahoji', 'dist')];
		this.commands = new Store<ICommand>({ name: 'commands', dirs: this.storeDirs, checker: isValidCommand });
		this.restManager = new REST({ version: '9' }).setToken(this.token);
	}

	async parseInteraction(
		interaction: APIInteraction
	): Promise<InteractionResponseWithBufferAttachments | APIApplicationCommandAutocompleteResponse | null> {
		console.log(JSON.stringify(interaction, null, 4));

		if (interaction.type === InteractionType.Ping) {
			return { type: 1 };
		}

		// Only support guild interactions for now, so we're guaranteed to have a member.
		if (!interaction.member) return null;
		const { member } = interaction;

		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			const { data } = interaction;
			const options = (data as any).options as AutocompleteData[];

			if (!data) return autocompleteResult([]);
			const command = this.commands.pieces.get(data.name);
			return {
				type: InteractionResponseType.ApplicationCommandAutocompleteResult,
				data: {
					choices: await handleAutocomplete(command, options, member)
				}
			};
		}

		if (interaction.type === InteractionType.ApplicationCommand) {
			const slashCommandInteraction = new SlashCommandInteraction(
				// TODO fix this
				interaction as APIChatInputApplicationCommandInteraction
			);

			const command = this.commands.pieces.get(interaction.data.name);
			if (command) {
				// Permissions
				if (command.requiredPermissions) {
					if (!slashCommandInteraction.member) return null;
					const permissions = BigInt(slashCommandInteraction.member.permissions);
					for (const perm of command.requiredPermissions) {
						const bit = PermissionFlagsBits[perm];
						if ((permissions & bit) !== bit) {
							return {
								data: {
									content: "You don't have permission to use this command.",
									flags: MessageFlags.Ephemeral
								},
								type: InteractionResponseType.ChannelMessageWithSource
							};
						}
					}
				}

				const response = await command.run({
					interaction: slashCommandInteraction,
					options: slashCommandInteraction.options,
					client: this,
					member: slashCommandInteraction.member!
				});
				const apiResponse: InteractionResponseWithBufferAttachments =
					typeof response === 'string'
						? { data: { content: response }, type: InteractionResponseType.ChannelMessageWithSource }
						: { data: { ...response }, type: InteractionResponseType.ChannelMessageWithSource };
				return apiResponse;
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
		const liveCommands = (await this.restManager.get(
			Routes.applicationGuildCommands(this.applicationID, this.developmentServerID)
		)) as APIApplicationCommand[];

		const changedCommands: ICommand[] = [];

		// Find commands that don't match their previous values
		for (const cmd of this.commands.values) {
			const liveCmd = liveCommands.find(c => c.name === cmd.name);
			if (
				!liveCmd ||
				cmd.description !== liveCmd.description ||
				JSON.stringify(liveCmd.options) !== JSON.stringify(cmd.options)
			) {
				changedCommands.push(cmd);
			}
		}

		// If more than 3 commands need to be updated, bulk update ALL of them.
		// Otherwise, just individually update the changed command(s)
		if (changedCommands.length > 3) {
			bulkUpdateCommands({ client: this, commands: changedCommands, guildID: this.developmentServerID });
		} else {
			changedCommands.map(command => updateCommand({ client: this, command, guildID: this.developmentServerID }));
		}
	}
}
