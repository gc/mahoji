import { InteractionResponseType, MessageFlags } from 'discord-api-types/payloads/v9';
import { Routes } from 'discord-api-types/rest/v9';

import type { APIChatInputApplicationCommandInteraction, CommandOptions } from '../types';
import { convertAPIOptionsToCommandOptions } from '../util';
import { Interaction } from './Interaction';
import type { MahojiClient } from './Mahoji';

export class SlashCommandInteraction extends Interaction<APIChatInputApplicationCommandInteraction> {
	options: CommandOptions;

	deferred = false;

	constructor(interaction: APIChatInputApplicationCommandInteraction, client: MahojiClient) {
		super(interaction, client);

		this.options = convertAPIOptionsToCommandOptions(interaction.data.options, interaction.data.resolved);
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
}
