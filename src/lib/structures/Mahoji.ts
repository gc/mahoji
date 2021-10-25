import { mergeDefault } from '@sapphire/utilities';
import {
	APIApplicationCommandInteractionDataOptionWithValues,
	APIChatInputApplicationCommandInteraction,
	APIInteractionResponse,
	InteractionResponseType,
	InteractionType
} from 'discord-api-types/v9';
import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifySensible from 'fastify-sensible';
import fs from 'fs/promises';
import { join } from 'path';

import { verifyDiscordCrypto } from '../handler';
import type { CachedCommand, ICommand } from '../types';
import {
	bulkUpdateCommands,
	cachedCommandsAreEqual,
	convertCommandToCachedCommand,
	CryptoKey,
	isValidCommand,
	updateCommand,
	webcrypto
} from '../util';
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
				new SlashCommandInteraction(interaction);
				for (const { name, value } of apiOptions) {
					options[name] = value;
				}
				const command = this.commands.pieces.get(interaction.data.name);
				if (command) {
					const response = await command.run({
						interaction,
						options,
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

		const cacheFilePath = join(this.storeDirs[0], '.mahoji');

		const hashStore = await fs.readFile(cacheFilePath).catch(() => null);
		const oldCachedCommands = hashStore !== null ? (JSON.parse(hashStore.toString()) as CachedCommand[]) : null;

		const commands = Array.from(this.commands.pieces.values());
		const currentCachedCommands = commands.map(convertCommandToCachedCommand).sort();

		// Find commands that don't match their previous values
		let differences: CachedCommand[] = [];
		for (const currentCachedCommand of currentCachedCommands) {
			const oldHash = oldCachedCommands?.find(t => t.name === currentCachedCommand.name);
			if (oldHash && !cachedCommandsAreEqual(oldHash, currentCachedCommand)) {
				console.log(`${oldHash?.name} ${currentCachedCommand.name} changed`);
				differences.push(currentCachedCommand);
			}
		}

		// Cache the current commands to a file
		await fs.writeFile(cacheFilePath, Buffer.from(JSON.stringify(currentCachedCommands, null, 4)));

		// If more than 3 commands need to be updated, bulk update ALL of them.
		// Otherwise, just individually update the changed command(s)
		if (differences.length > 3) {
			bulkUpdateCommands({ client: this, commands, isGlobal: false });
		} else {
			for (const changedCachedCommand of differences) {
				const command = commands.find(c => c.name === changedCachedCommand.name);
				if (command) {
					updateCommand({ client: this, command, isGlobal: false });
				}
			}
		}
	}
}
