import type { APIChatInputApplicationCommandInteraction, CommandOptions } from '../types';
import { convertAPIOptionsToCommandOptions } from '../util';
import { Interaction } from './Interaction';

export class SlashCommandInteraction extends Interaction<APIChatInputApplicationCommandInteraction> {
	options: CommandOptions;

	constructor(interaction: APIChatInputApplicationCommandInteraction) {
		super(interaction);

		this.options = convertAPIOptionsToCommandOptions(interaction.data.options, interaction.data.resolved);
	}
}
