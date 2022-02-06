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
	guildID: bigint;
	userID: bigint;
	member: APIInteractionGuildMember;
	user: APIUser;
	data: IInteraction['data'];

	constructor(interaction: IInteraction['data']['interaction'], client: MahojiClient) {
		this.id = interaction.id;
		this.token = interaction.token;

		if (
			!interaction.guild_id ||
			!interaction.channel_id ||
			!interaction.member?.user.id ||
			!interaction.member ||
			!interaction.member.user
		) {
			throw new Error('Missing essential properties for base Interaction.');
		}

		this.client = client;
		this.guildID = BigInt(interaction.guild_id);
		this.channelID = BigInt(interaction.channel_id);
		this.userID = BigInt(interaction.member.user.id);
		this.applicationID = interaction.application_id;
		this.member = interaction.member;
		this.user = interaction.member.user;
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
							fileName: a.fileName,
							fileData: a.buffer
					  }))
					: undefined;
			delete result.response.data?.attachments;
			console.log(result.response);
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
