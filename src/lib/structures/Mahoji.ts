import { REST } from '@discordjs/rest';
import {
	APIApplicationCommand,
	APIChatInputApplicationCommandInteraction,
	APIInteraction,
	APIInteractionResponse,
	InteractionResponseType,
	InteractionType,
	Routes
} from 'discord-api-types/v9';
import { EventEmitter } from 'events';
import { join } from 'path';

import type { Adapter } from '../types';
import { bulkUpdateCommands, isValidCommand, updateCommand } from '../util';
import type { ICommand } from './ICommand';
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

export class MahojiClient extends EventEmitter {
	commands: Store<ICommand>;
	token: string;
	developmentServerID: string;
	applicationID: string;
	storeDirs: string[];
	restManager: REST;
	adapters: Adapter[] = [];

	constructor(options: MahojiOptions) {
		super();

		this.token = options.discordToken;
		this.developmentServerID = options.developmentServerID;
		this.applicationID = options.applicationID;

		this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), join('node_modules', 'mahoji', 'dist')];
		this.commands = new Store<ICommand>({ name: 'commands', dirs: this.storeDirs, checker: isValidCommand });
		this.restManager = new REST({ version: '9' }).setToken(this.token);
	}

	async parseInteraction(interaction: APIInteraction): Promise<APIInteractionResponse | null> {
		if (interaction.type === InteractionType.Ping) {
			return { type: 1 };
		}

		if (interaction.type === InteractionType.ApplicationCommand) {
			const slashCommandInteraction = new SlashCommandInteraction(
				interaction as APIChatInputApplicationCommandInteraction
			);

			const command = this.commands.pieces.get(interaction.data.name);
			if (command) {
				const response = await command.run({
					interaction: slashCommandInteraction,
					options: slashCommandInteraction.options,
					client: this
				});
				const apiResponse: APIInteractionResponse =
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
