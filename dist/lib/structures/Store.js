"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const util_1 = require("../util");
class Store {
    constructor(options) {
        Object.defineProperty(this, "pieces", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dirs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "checker", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = options.name;
        this.pieces = new Map();
        this.dirs = options.dirs;
        this.checker = options.checker;
    }
    async load() {
        const files = (await Promise.all(this.dirs.map(async (dir) => {
            const path = (0, path_1.join)(process.cwd(), dir, this.name);
            return (await (0, promises_1.readdir)(path).catch(() => []))
                .filter(fileName => (0, path_1.extname)(fileName) === '.js')
                .map(fileName => (0, path_1.join)(path, fileName));
        }))).flat();
        for (const filePath of files) {
            const exports = await Promise.resolve().then(() => __importStar(require(filePath)));
            const pieces = Object.values(exports).filter(util_1.isValidPiece).filter(this.checker);
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
exports.Store = Store;
//# sourceMappingURL=Store.js.map