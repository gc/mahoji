import type { APIInteractionGuildMember, APIMessage, APIUser, Snowflake } from 'discord-api-types/v9';

import type { APIChatInputApplicationCommandInteraction, CommandOptions } from '../types';
import { convertAPIOptionsToCommandOptions } from '../util';
import { Interaction } from './Interaction';

export class SlashCommandInteraction extends Interaction<APIChatInputApplicationCommandInteraction> {
	options: CommandOptions;
	id: Snowflake;
	applicationID: Snowflake;
	token: string;

	message?: APIMessage;
	channelID?: Snowflake;
	guildID?: Snowflake;
	member?: APIInteractionGuildMember;
	user?: APIUser;

	constructor(interaction: APIChatInputApplicationCommandInteraction) {
		super(interaction);

		this.options = convertAPIOptionsToCommandOptions(interaction.data.options, interaction.data.resolved);
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
