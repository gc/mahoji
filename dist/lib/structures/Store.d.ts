import type { Piece } from '../types';
export declare class Store<T extends Piece> {
    pieces: Map<string, T>;
    name: string;
    dirs: string[];
    checker: (data: unknown) => data is T;
    constructor(options: {
        name: string;
        dirs: string[];
        checker: (data: unknown) => data is T;
    });
    load(): Promise<this>;
    get values(): T[];
}
//# sourceMappingURL=Store.d.ts.map