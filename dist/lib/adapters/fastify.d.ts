import type { APIInteraction } from 'discord-api-types/v9';
import { FastifyInstance, FastifyRequest, FastifyServerOptions } from 'fastify';
import type { MahojiClient } from '../..';
import type { Adapter } from '../types';
import { CryptoKey } from '../util';
interface Response {
    message: string;
    error: string;
    statusCode: number;
}
export declare const makeErrorResponse: (err: string, code: number) => Response;
declare module 'fastify' {
    interface FastifyReply {
        unauthorized(str?: string): FastifyReply;
        notFound(str?: string): FastifyReply;
        badRequest(str?: string): FastifyReply;
        internalServerError(str?: string): FastifyReply;
        tooManyRequests(str?: string): FastifyReply;
    }
}
declare type VerifiedCryptoResponse = {
    isVerified: false;
    interaction: null;
} | {
    isVerified: true;
    interaction: APIInteraction;
};
export declare function verifyDiscordCrypto({ request, cryptoKey }: {
    request: FastifyRequest;
    cryptoKey: CryptoKey;
}): Promise<VerifiedCryptoResponse>;
export declare class FastifyAdapter implements Adapter {
    client: MahojiClient;
    interactionsEndpointURL: string;
    httpPort: number;
    server: FastifyInstance;
    cryptoKey: Promise<CryptoKey>;
    discordPublicKey: string;
    constructor({ fastifyOptions, client, httpPort, interactionsEndpointURL, discordPublicKey }: {
        client: MahojiClient;
        fastifyOptions: FastifyServerOptions;
        interactionsEndpointURL: string;
        httpPort: number;
        discordPublicKey: string;
    });
    init(): Promise<void>;
}
export {};
//# sourceMappingURL=fastify.d.ts.map