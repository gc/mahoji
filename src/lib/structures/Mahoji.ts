import { REST } from '@discordjs/rest';
import {
	APIChatInputApplicationCommandInteraction,
	APIInteraction,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	PermissionFlagsBits
} from 'discord-api-types/v9';
import { join } from 'path';

import type { Adapter, InteractionErrorResponse, InteractionResponse } from '../types';
import { autocompleteResult, bitFieldHasBit, handleAutocomplete, isValidCommand } from '../util';
import type { CommandResponse, ICommand, InteractionResponseWithBufferAttachments } from './ICommand';
import { Interaction } from './Interaction';
import { SlashCommandInteraction } from './SlashCommandInteraction';
import { Store } from './Store';

interface MahojiOptions {
	discordToken: string;
	developmentServerID: string;
	applicationID: string;
	storeDirs?: string[];
	handlers?: Handlers;
}

export const defaultMahojiOptions = {
	discordPublicKey: '',
	discordToken: '',
	developmentServer: ''
} as const;

export interface Handlers {
	preCommand?: (options: {
		command: ICommand;
		interaction: SlashCommandInteraction;
	}) => Promise<Awaited<CommandResponse> | undefined>;
	postCommand?: (options: {
		command: ICommand;
		interaction: SlashCommandInteraction;
		error: Error | null;
		response: InteractionResponseWithBufferAttachments | null;
		inhibited: boolean;
	}) => Promise<unknown>;
}

export class MahojiClient {
	commands: Store<ICommand>;
	token: string;
	developmentServerID: string;
	applicationID: string;
	storeDirs: string[];
	restManager: REST;
	adapters: Adapter[] = [];
	handlers: Handlers;

	constructor(options: MahojiOptions) {
		this.token = options.discordToken;
		this.developmentServerID = options.developmentServerID;
		this.applicationID = options.applicationID;

		this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), join('node_modules', 'mahoji', 'dist')];
		this.commands = new Store<ICommand>({ name: 'commands', dirs: this.storeDirs, checker: isValidCommand });
		this.restManager = new REST({ version: '9' }).setToken(this.token);
		this.handlers = options.handlers ?? {};
	}

	async parseInteraction(
		interaction: APIInteraction
	): Promise<InteractionResponse | InteractionErrorResponse | null> {
		if (interaction.type === InteractionType.Ping) {
			return { response: { type: 1 }, interaction: null, type: InteractionType.Ping };
		}

		const user = interaction.member?.user ?? interaction.user;

		if (!user) return null;

		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			const { data } = interaction;
			if (!data) return autocompleteResult(interaction, this, []);
			const { options } = data;
			const command = this.commands.pieces.get(data.name);
			const choices = await handleAutocomplete(command, options, user, interaction.member);
			return {
				response: {
					type: InteractionResponseType.ApplicationCommandAutocompleteResult,
					data: {
						choices
					}
				},
				interaction: new Interaction(interaction, this),
				type: InteractionType.ApplicationCommandAutocomplete
			};
		}

		if (interaction.type === InteractionType.ApplicationCommand) {
			const command = this.commands.pieces.get(interaction.data.name);
			if (!command) return null;
			const slashCommandInteraction = new SlashCommandInteraction(
				interaction as APIChatInputApplicationCommandInteraction,
				this
			);

			// Permissions
			if (slashCommandInteraction.command.requiredPermissions) {
				if (!slashCommandInteraction.member) return null;
				for (const perm of slashCommandInteraction.command.requiredPermissions) {
					if (!bitFieldHasBit(slashCommandInteraction.member.permissions, PermissionFlagsBits[perm])) {
						return {
							response: {
								data: {
									content: "You don't have permission to use this command.",
									flags: MessageFlags.Ephemeral
								},
								type: InteractionResponseType.ChannelMessageWithSource
							},
							interaction: slashCommandInteraction,
							type: InteractionType.ApplicationCommand
						};
					}
				}
			}

			let error: Error | null = null;
			let response: InteractionResponseWithBufferAttachments | null = null;
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
							data:
								typeof inhibitedResponse === 'string'
									? {
											content: inhibitedResponse,
											flags: MessageFlags.Ephemeral
									  }
									: {
											flags: MessageFlags.Ephemeral,
											...inhibitedResponse
									  },
							type: InteractionResponseType.ChannelMessageWithSource
						},
						interaction: slashCommandInteraction,
						type: InteractionType.ApplicationCommand
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
						? { data: { content: rawResponse }, type: InteractionResponseType.ChannelMessageWithSource }
						: { data: { ...rawResponse }, type: InteractionResponseType.ChannelMessageWithSource };

				if (!response) return null;

				return {
					response,
					interaction: slashCommandInteraction,
					type: InteractionType.ApplicationCommand
				};
			} catch (err) {
				if (!(err instanceof Error)) console.error('Received an error that isnt an Error.');
				error = err as Error;
				if (error) {
					return { error, interaction: slashCommandInteraction, type: InteractionType.ApplicationCommand };
				}
			} finally {
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
		await this.commands.load();
		await Promise.all(this.adapters.map(adapter => adapter.init()));
	}
}
