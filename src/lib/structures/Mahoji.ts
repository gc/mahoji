import { ChatInputCommandInteraction, Client, Interaction, PermissionFlagsBits } from 'discord.js';
import { join } from 'path';

import { convertAPIOptionsToCommandOptions, handleAutocomplete, isValidCommand } from '../util';
import type { CommandResponse, ICommand } from './ICommand';
import { Store } from './Store';

interface MahojiOptions {
	developmentServerID: string;
	applicationID: string;
	storeDirs?: string[];
	handlers?: Handlers;
	djsClient: Client;
}

export const defaultMahojiOptions = {
	developmentServer: ''
} as const;

export interface Handlers {
	preCommand?: (options: {
		command: ICommand;
		interaction: ChatInputCommandInteraction;
	}) => Promise<Awaited<CommandResponse> | undefined>;
	postCommand?: (options: {
		command: ICommand;
		interaction: ChatInputCommandInteraction;
		error: Error | null;
		inhibited: boolean;
	}) => Promise<unknown>;
}

export class MahojiClient {
	commands: Store<ICommand>;
	developmentServerID: string;
	applicationID: string;
	storeDirs: string[];
	handlers: Handlers;
	djsClient: Client;

	constructor(options: MahojiOptions) {
		this.developmentServerID = options.developmentServerID;
		this.applicationID = options.applicationID;

		this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), join('node_modules', 'mahoji', 'dist')];
		this.commands = new Store<ICommand>({ name: 'commands', dirs: this.storeDirs, checker: isValidCommand });
		this.handlers = options.handlers ?? {};
		this.djsClient = options.djsClient;
	}

	async parseInteraction(interaction: Interaction) {
		const member = interaction.inCachedGuild() ? interaction.member : undefined;

		if (interaction.isAutocomplete()) {
			const command = this.commands.pieces.get(interaction.commandName);
			const choices = await handleAutocomplete(command, interaction, member);
			return interaction.respond(choices);
		}

		if (interaction.isChatInputCommand()) {
			const command = this.commands.pieces.get(interaction.commandName);
			if (!command) return null;

			// Permissions
			if (command.requiredPermissions) {
				if (!interaction.member || !interaction.memberPermissions) return null;
				for (const perm of command.requiredPermissions) {
					if (!interaction.memberPermissions.has(PermissionFlagsBits[perm])) {
						return interaction.reply({
							content: "You don't have permission to use this command.",
							ephemeral: true
						});
					}
				}
			}

			let error: Error | null = null;
			let inhibited = false;
			try {
				const inhibitedResponse = await this.handlers.preCommand?.({
					command,
					interaction
				});
				if (inhibitedResponse) {
					inhibited = true;
					const res =
						typeof inhibitedResponse === 'string'
							? {
									content: inhibitedResponse
							  }
							: {
									...inhibitedResponse
							  };
					return interaction.reply({
						ephemeral: true,
						...res
					});
				}

				const response = await command.run({
					interaction,
					options: convertAPIOptionsToCommandOptions(interaction.options.data, interaction.options.resolved),
					client: this,
					user: interaction.user,
					member: interaction.member,
					channelID: interaction.channelId,
					guildID: interaction.guild?.id,
					userID: interaction.user.id
				});
				if (!response) return;
				if (interaction.deferred) {
					return interaction.editReply(response);
				}
				const replyResponse = await interaction.reply(response);
				return replyResponse;
			} catch (err) {
				if (!(err instanceof Error)) console.error('Received an error that isnt an Error.');
				error = err as Error;
				if (error) {
					return { error };
				}
			} finally {
				await this.handlers.postCommand?.({
					command,
					interaction,
					error,
					inhibited
				});
			}
		}

		return null;
	}

	async start() {
		await this.commands.load();
	}
}
