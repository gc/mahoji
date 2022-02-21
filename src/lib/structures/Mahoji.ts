import { REST } from '@discordjs/rest';
import {
	APIApplicationCommand,
	APIChatInputApplicationCommandInteraction,
	APIInteraction,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	PermissionFlagsBits,
	Routes
} from 'discord-api-types/v9';
import { join } from 'path';

import type { Adapter, InteractionErrorResponse, InteractionResponse } from '../types';
import {
	autocompleteResult,
	bitFieldHasBit,
	bulkUpdateCommands,
	commandOptionMatches,
	convertCommandOptionToAPIOption,
	handleAutocomplete,
	isValidCommand,
	updateCommand
} from '../util';
import type {
	ICommand,
	InteractionResponseDataWithBufferAttachments,
	InteractionResponseWithBufferAttachments
} from './ICommand';
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
	preCommand?: (options: { command: ICommand; interaction: SlashCommandInteraction }) => Promise<string | undefined>;
	postCommand?: (options: {
		command: ICommand;
		interaction: SlashCommandInteraction;
		error: Error | null;
		response: InteractionResponseWithBufferAttachments | null;
	}) => Promise<string | undefined>;
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

		if (!user) {
			return null;
		}

		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			const { data } = interaction;
			if (!data) return autocompleteResult(interaction, this, []);
			const { options } = data;
			const command = this.commands.pieces.get(data.name);
			return {
				response: {
					type: InteractionResponseType.ApplicationCommandAutocompleteResult,
					data: {
						choices: await handleAutocomplete(command, options, user, interaction.member)
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

			const inhibitedResponse = await this.handlers.preCommand?.({
				command: slashCommandInteraction.command,
				interaction: slashCommandInteraction
			});
			if (inhibitedResponse) {
				return {
					response: {
						data: {
							content: inhibitedResponse,
							flags: MessageFlags.Ephemeral
						},
						type: InteractionResponseType.ChannelMessageWithSource
					},
					interaction: slashCommandInteraction,
					type: InteractionType.ApplicationCommand
				};
			}

			let error: Error | null = null;
			let response: string | InteractionResponseDataWithBufferAttachments | null = null;
			try {
				response = await slashCommandInteraction.command.run({
					interaction: slashCommandInteraction,
					options: slashCommandInteraction.options,
					client: this,
					user: slashCommandInteraction.user,
					member: slashCommandInteraction.member,
					channelID: slashCommandInteraction.channelID,
					guildID: slashCommandInteraction.guildID,
					userID: slashCommandInteraction.userID
				});
			} catch (err: unknown) {
				if (!(err instanceof Error)) console.error('Received an error that isnt an Error.');
				error = err as Error;
			}

			const apiResponse: InteractionResponseWithBufferAttachments | null =
				response === null
					? slashCommandInteraction.data.response?.response ?? null
					: typeof response === 'string'
					? { data: { content: response }, type: InteractionResponseType.ChannelMessageWithSource }
					: { data: { ...response }, type: InteractionResponseType.ChannelMessageWithSource };

			await this.handlers.postCommand?.({
				command: slashCommandInteraction.command,
				interaction: slashCommandInteraction,
				error,
				response: apiResponse
			});

			if (error) return { error, interaction: slashCommandInteraction, type: InteractionType.ApplicationCommand };
			if (!apiResponse) return null;

			return {
				response: apiResponse,
				interaction: slashCommandInteraction,
				type: InteractionType.ApplicationCommand
			};
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
			const currentOptions = currentCommand.options.map(convertCommandOptionToAPIOption);
			const liveOptions = liveCmd.options;

			for (let i = 0; i < currentOptions.length; i++) {
				const liveOpt = liveOptions?.[i];

				const match = liveOpt && commandOptionMatches(liveOpt, currentOptions[i]);
				if (match && !match.matches) {
					changedCommands.push(currentCommand);
				}
			}
		}

		// If more than 3 commands need to be updated, bulk update ALL of them.
		// Otherwise, just individually update the changed command(s)
		if (changedCommands.length > 3) {
			bulkUpdateCommands({ client: this, commands: this.commands.values, guildID: this.developmentServerID });
		} else {
			changedCommands.map(command => updateCommand({ client: this, command, guildID: this.developmentServerID }));
		}
	}
}
