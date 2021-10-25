import type { APIInteraction, APIInteractionGuildMember, APIMessage, APIUser, Snowflake } from 'discord-api-types/v9';

export class Interaction<T extends APIInteraction> {
	interaction: T;
	id: Snowflake;
	applicationID: Snowflake;
	token: string;

	message?: APIMessage;
	channelID?: Snowflake;
	guildID?: Snowflake;
	member?: APIInteractionGuildMember;
	user?: APIUser;

	constructor(interaction: T) {
		this.interaction = interaction;

		this.id = interaction.id;
		this.guildID = interaction.guild_id;
		this.channelID = interaction.channel_id;
		this.applicationID = interaction.application_id;
		this.member = interaction.member;
		this.user = interaction.user;
		this.token = interaction.token;
		this.message = interaction.message;
	}
}
