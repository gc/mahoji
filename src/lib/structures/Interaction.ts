import type { APIInteraction } from 'discord-api-types/v9';

export class Interaction<T extends APIInteraction> {
	interaction: T;

	constructor(interaction: T) {
		this.interaction = interaction;
	}
}
