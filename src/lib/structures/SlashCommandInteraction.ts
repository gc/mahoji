import { InteractionResponseType, InteractionType, MessageFlags } from 'discord-api-types/payloads/v9';
import { Routes } from 'discord-api-types/rest/v9';

import type {
	APIChatInputApplicationCommandInteraction,
	CommandOptions,
	ISlashCommandData,
	SlashCommandResponse
} from '../types';
import { convertAPIOptionsToCommandOptions } from '../util';
import type { ICommand } from './ICommand';
import { Interaction } from './Interaction';
import type { MahojiClient } from './Mahoji';

export class SlashCommandInteraction extends Interaction {
	options: CommandOptions;
	command: ICommand;

	deferred = false;
	type: InteractionType.ApplicationCommand = InteractionType.ApplicationCommand;
	declare data: ISlashCommandData;

	constructor(interaction: APIChatInputApplicationCommandInteraction, client: MahojiClient) {
		super(interaction, client);

		this.options = convertAPIOptionsToCommandOptions(interaction.data.options, interaction.data.resolved);
		const command = client.commands.pieces.get(interaction.data.name);
		if (!command) {
			throw new Error(`'${interaction.data.name}' command does not exist.`);
		}
		this.command = command;
	}

	async deferReply(options?: { ephemeral?: boolean }) {
		this.deferred = true;
		await this.client.restManager.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined
				}
			}
		});
	}

	async respond({ response }: SlashCommandResponse): Promise<void> {
		// If this response is for a deferred interaction, we have to use a different route/method/body.
		if (this.deferred) {
			await this.client.restManager.patch(
				Routes.webhookMessage(this.client.applicationID, this.data.interaction.token),
				{
					body: { ...response.data, attachments: undefined },
					files:
						response.data && 'attachments' in response.data
							? response.data.attachments?.map(a => ({
									name: a.fileName,
									data: a.buffer
							  }))
							: undefined
				}
			);
			return;
		}
		return super.respond({ response, interaction: this, type: InteractionType.ApplicationCommand });
	}
}
