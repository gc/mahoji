import { REST } from '@discordjs/rest';
import { mergeDefault } from '@sapphire/utilities';
import {
	APIApplicationCommand,
	APIApplicationCommandInteractionDataOptionWithValues,
	APIChatInputApplicationCommandInteraction,
	APIInteractionResponse,
	InteractionResponseType,
	InteractionType,
	Routes
} from 'discord-api-types/v9';
import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifySensible from 'fastify-sensible';
import { join } from 'path';

import { verifyDiscordCrypto } from '../handler';
import type { ICommand } from '../types';
import { bulkUpdateCommands, CryptoKey, isValidCommand, updateCommand, webcrypto } from '../util';
import { SlashCommandInteraction } from './SlashCommandInteraction';
import { Store } from './Store';

interface MahojiOptions {
	fastifyOptions?: FastifyServerOptions;
	discordPublicKey: string;
	discordToken: string;
	developmentServerID: string;
	discordBaseURL?: string;
	applicationID: string;
	interactionsEndpointURL?: string;
	httpPort: number;
	storeDirs?: string[];
}

export const defaultMahojiOptions = {
	fastifyOptions: {},
	discordPublicKey: '',
	discordToken: '',
	developmentServer: '',
	discordBaseURL: 'https://discord.com/api/v9',
	interactionsEndpointURL: '/'
} as const;

export class MahojiClient {
	server: FastifyInstance;
	cryptoKey: Promise<CryptoKey>;
	commands: Store<ICommand>;
	token: string;
	developmentServerID: string;
	discordBaseURL: string;
	applicationID: string;
	interactionsEndpointURL: string;
	httpPort: number;
	storeDirs: string[];
	restManager: REST;

	constructor(options: MahojiOptions) {
		this.cryptoKey = webcrypto.subtle.importKey(
			'raw',
			Buffer.from(options.discordPublicKey, 'hex'),
			{ name: 'NODE-ED25519', namedCurve: 'NODE-ED25519', public: true },
			false,
			['verify']
		);
		this.token = options.discordToken;
		this.discordBaseURL = options.discordBaseURL ?? defaultMahojiOptions.discordBaseURL;
		this.developmentServerID = options.developmentServerID;
		this.applicationID = options.applicationID;
		this.interactionsEndpointURL = options.interactionsEndpointURL ?? defaultMahojiOptions.interactionsEndpointURL;
		this.httpPort = options.httpPort;
		this.storeDirs = [...(options.storeDirs ?? [process.cwd()]), join('node_modules', 'mahoji', 'dist')];
		this.commands = new Store<ICommand>({ name: 'commands', dirs: this.storeDirs, checker: isValidCommand });
		this.restManager = new REST({ version: '9' }).setToken(this.token);

		this.server = fastify(mergeDefault(defaultMahojiOptions.fastifyOptions ?? {}, options.fastifyOptions));

		this.server.register(fastifySensible, { errorHandler: false });
		this.server.post(this.interactionsEndpointURL, async (req, res) => {
			const result = await verifyDiscordCrypto({
				request: req,
				cryptoKey: await this.cryptoKey
			});

			if (!result.isVerified) {
				return res.badRequest();
			}

			if (result.interaction.type === InteractionType.Ping) {
				return res.send({ type: 1 });
			}

			if (result.interaction.type === InteractionType.ApplicationCommand) {
				const interaction = result.interaction as APIChatInputApplicationCommandInteraction;
				const apiOptions = (interaction.data.options ??
					[]) as APIApplicationCommandInteractionDataOptionWithValues[];
				const options: Record<string, APIApplicationCommandInteractionDataOptionWithValues['value']> = {};
				const slashCommandInteraction = new SlashCommandInteraction(interaction);
				for (const { name, value } of apiOptions) {
					options[name] = value;
				}
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
					return res.send(apiResponse);
				}
			}

			return res.notFound();
		});
	}

	async start() {
		await this.cryptoKey;
		await this.loadStores();
		return this.server.listen(this.httpPort);
	}

	async loadStores() {
		await Promise.all([this.commands].map(store => store.load()));
		if (process.env.NODE_ENV !== 'test') await this.updateCommands();
	}

	async updateCommands() {
		console.log(`${this.commands.pieces.size} commands`);
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
