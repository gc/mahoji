import type { APIInteraction, APIInteractionGuildMember, APIMessage, APIUser, Snowflake } from 'discord-api-types/v9';

import type { MahojiClient } from './Mahoji';

export class Interaction<T extends APIInteraction> {
	interaction: T;
	id: Snowflake;
	applicationID: Snowflake;
	token: string;
	client: MahojiClient;

	message?: APIMessage;
	channelID!: bigint;
	guildID!: bigint;
	userID!: bigint;
	member!: APIInteractionGuildMember;
	user!: APIUser;

	constructor(interaction: T, client: MahojiClient) {
		this.interaction = interaction;

		this.id = interaction.id;
		this.guildID = BigInt(interaction.guild_id!);
		this.channelID = BigInt(interaction.channel_id!);
		this.userID = BigInt(interaction.member!.user.id);
		this.applicationID = interaction.application_id;
		this.member = interaction.member!;
		this.user = interaction.member!.user!;
		this.token = interaction.token;
		this.message = interaction.message;
		this.client = client;
	}
}
