import { APIInteractionGuildMember, APIMessage, APIUser, InteractionType, Routes } from 'discord-api-types/v9';

import type { IInteraction, InteractionResponse } from '../types';
import type { MahojiClient } from './Mahoji';

export class Interaction implements IInteraction {
	id: string;
	applicationID: string;
	token: string;
	client: MahojiClient;
	message?: APIMessage | undefined;
	channelID: bigint;
	guildID?: bigint;
	userID: bigint;
	member?: APIInteractionGuildMember;
	user: APIUser;
	data: IInteraction['data'];

	constructor(interaction: IInteraction['data']['interaction'], client: MahojiClient) {
		this.id = interaction.id;
		this.token = interaction.token;

		const user = interaction.member?.user ?? interaction.user;

		if ((!interaction.user && !interaction.guild_id) || !interaction.channel_id || !user || !user.id) {
			throw new Error('Missing essential properties for base Interaction.');
		}

		this.client = client;
		this.guildID = interaction.guild_id ? BigInt(interaction.guild_id) : undefined;
		this.channelID = BigInt(interaction.channel_id);
		this.userID = BigInt(user.id);
		this.applicationID = interaction.application_id;
		this.member = interaction.member;
		this.user = user;
		this.message = interaction.message;

		// @ts-ignore TODO
		this.data = {
			interaction,
			type: interaction.type,
			response: null
		};
	}

	async respond(result: InteractionResponse): Promise<void> {
		const route = Routes.interactionCallback(this.data.interaction.id, this.data.interaction.token);
		if (result.type === InteractionType.ApplicationCommand) {
			const files =
				result.response.data && 'attachments' in result.response.data
					? result.response.data.attachments?.map(a => ({
							name: a.fileName,
							data: a.buffer
					  }))
					: undefined;
			if (result.response.data?.attachments) {
				result.response.data.attachments = result.response.data?.attachments?.map((i, ind) => ({
					filename: i.fileName,
					id: ind
				})) as any;
			}

			await this.client.restManager.post(route, {
				body: {
					...result.response
				},
				files
			});
			return;
		}

		await this.client.restManager.post(route, { body: result.response });
	}
}
