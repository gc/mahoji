import { readdir } from 'fs/promises';
import { extname, join } from 'path';

import type { Piece } from '../types';
import { isValidPiece } from '../util';

export class Store<T extends Piece> {
	pieces: Map<string, T>;
	name: string;
	dirs: string[];
	checker: (data: unknown) => data is T;

	constructor(options: { name: string; dirs: string[]; checker: (data: unknown) => data is T }) {
		this.name = options.name;
		this.pieces = new Map<string, T>();
		this.dirs = options.dirs;
		this.checker = options.checker;
	}

	async load() {
		const files = (
			await Promise.all(
				this.dirs.map(async dir => {
					const path = join(process.cwd(), dir, this.name);
					return (await readdir(path).catch(() => []))
						.filter(fileName => extname(fileName) === '.js')
						.map(fileName => join(path, fileName));
				})
			)
		).flat();

		for (const filePath of files) {
			const exports = await import(filePath);
			const pieces = Object.values(exports).filter(isValidPiece).filter(this.checker);
			for (const piece of pieces) {
				this.pieces.set(piece.name, piece);
			}
		}

		return this;
	}

	get values() {
		return Array.from(this.pieces.values());
	}
}
