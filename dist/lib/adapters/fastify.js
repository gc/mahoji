"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastifyAdapter = exports.verifyDiscordCrypto = exports.makeErrorResponse = void 0;
const tslib_1 = require("tslib");
const fastify_1 = (0, tslib_1.__importDefault)(require("fastify"));
const form_data_1 = (0, tslib_1.__importDefault)(require("form-data"));
const util_1 = require("../util");
const makeErrorResponse = (err, code) => ({
    message: err,
    error: err,
    statusCode: code
});
exports.makeErrorResponse = makeErrorResponse;
/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable func-names */
function decorate(server) {
    server.decorateReply('unauthorized', function (string) {
        this.code(401).send((0, exports.makeErrorResponse)(string ?? 'Unauthorized', 401));
    });
    server.decorateReply('notFound', function (string) {
        this.code(404).send((0, exports.makeErrorResponse)(string ?? 'Not Found', 404));
    });
    server.decorateReply('badRequest', function (string) {
        this.code(400).send((0, exports.makeErrorResponse)(string ?? 'Bad Request', 400));
    });
    server.decorateReply('internalServerError', function (string) {
        this.code(500).send((0, exports.makeErrorResponse)(string ?? 'Internal server error', 500));
    });
    server.decorateReply('tooManyRequests', function (string) {
        this.code(429).send((0, exports.makeErrorResponse)(string ?? 'Too many requests', 429));
    });
}
const failedResponse = {
    isVerified: false,
    interaction: null
};
async function verifyDiscordCrypto({ request, cryptoKey }) {
    const timestamp = request.headers['x-signature-timestamp'] ?? '';
    const signature = request.headers['x-signature-ed25519'] ?? '';
    const body = request.body;
    if (!body ||
        typeof body !== 'object' ||
        !timestamp ||
        !signature ||
        Array.isArray(timestamp) ||
        Array.isArray(signature) ||
        !body.id ||
        !body.type ||
        !body.application_id) {
        return failedResponse;
    }
    const timestampNumber = Number(timestamp);
    let convertedNow = Date.now() / 1000;
    if (isNaN(timestampNumber) || timestampNumber < convertedNow - 5) {
        return failedResponse;
    }
    const result = await util_1.webcrypto.subtle.verify('NODE-ED25519', cryptoKey, Buffer.from(signature, 'hex'), Buffer.from(timestamp + JSON.stringify(body)));
    if (!result)
        return failedResponse;
    return {
        isVerified: true,
        interaction: request.body
    };
}
exports.verifyDiscordCrypto = verifyDiscordCrypto;
class FastifyAdapter {
    constructor({ fastifyOptions, client, httpPort, interactionsEndpointURL, discordPublicKey }) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "interactionsEndpointURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "httpPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "server", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cryptoKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "discordPublicKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = client;
        this.client.adapters.push(this);
        this.interactionsEndpointURL = interactionsEndpointURL;
        this.httpPort = httpPort;
        this.discordPublicKey = discordPublicKey;
        this.cryptoKey = util_1.webcrypto.subtle.importKey('raw', Buffer.from(this.discordPublicKey, 'hex'), { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519', public: true }, false, ['verify']);
        this.server = (0, fastify_1.default)(fastifyOptions);
        this.server.addHook('onError', (__, _, err) => console.error(err));
        this.server.post(this.interactionsEndpointURL, async (req, res) => {
            const result = await verifyDiscordCrypto({
                request: req,
                cryptoKey: await this.cryptoKey
            });
            if (!result.isVerified) {
                return res.badRequest();
            }
            const response = await this.client.parseInteraction(result.interaction);
            if (response) {
                if ('error' in response) {
                    return res.send(util_1.ERROR_RESPONSE);
                }
                const formData = (0, util_1.handleFormData)(response);
                if (formData instanceof form_data_1.default) {
                    res.headers(formData.getHeaders()).send(formData);
                }
                else {
                    res.send(formData.response);
                }
                return;
            }
            return res.notFound();
        });
        decorate(this.server);
    }
    async init() {
        await this.cryptoKey;
        await this.server.listen(this.httpPort);
    }
}
exports.FastifyAdapter = FastifyAdapter;
//# sourceMappingURL=fastify.js.map