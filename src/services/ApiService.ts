/* eslint-disable keyword-spacing  */
/* eslint-disable implicit-arrow-linebreak  */

/**
 * API Functions
 */

import merge from 'lodash/merge';

import { ProfileRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

import { SHA256 } from '@common/libs/crypto';
import { AppConfig, ErrorMessages, APIConfig } from '@common/constants';

import { GetDeviceUniqueId } from '@common/helpers/device';

import LoggerService from '@services/LoggerService';

/* Types  ==================================================================== */
type Methods = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/* Service  ==================================================================== */
class ApiService {
    private readonly apiUrl: string;
    private readonly userAgent: string;
    private readonly timeoutSec: number;
    private endpoints: Map<string, string>;
    private idempotencyInt: number;
    private requestCounter: number;
    private accessToken: string;
    private uniqueDeviceIdentifier: string;
    private logger: any;
    [index: string]: any;

    constructor() {
        // Config
        this.apiUrl = APIConfig.apiUrl;
        this.userAgent = `${AppConfig.appName}`;
        this.endpoints = APIConfig.endpoints;

        // After 100 seconds, let's call it a day!
        this.timeoutSec = 100 * 1000;
        // Number each API request (used for debugging)
        this.requestCounter = 0;

        // Api accessToken
        this.accessToken = undefined;
        this.idempotencyInt = 0;

        // Logger
        this.logger = LoggerService.createLogger('Api');

        /**
         * Build services from endpoints
         * - So we can call ApiService.transactions.get() for example
         */
        this.endpoints.forEach((endpoint, key) => {
            (<any>this)[key] = {
                get: (params: any, payload: any, header?: any) =>
                    this.fetcher('GET', endpoint, params, payload, header),
                post: (params: any, payload: any, header?: any) =>
                    this.fetcher('POST', endpoint, params, payload, header),
                patch: (params: any, payload: any, header?: any) =>
                    this.fetcher('PATCH', endpoint, params, payload, header),
                put: (params: any, payload: any, header?: any) =>
                    this.fetcher('PUT', endpoint, params, payload, header),
                delete: (params: any, payload: any, header?: any) =>
                    this.fetcher('DELETE', endpoint, params, payload, header),
            };
        });
    }

    initialize(coreSettings: CoreSchema) {
        return new Promise<void>((resolve, reject) => {
            try {
                // if the app is initialized and the access token set
                if (coreSettings && coreSettings.initialized) {
                    const profile = ProfileRepository.getProfile();
                    if (profile && profile.accessToken) {
                        this.accessToken = profile.accessToken;
                        this.idempotencyInt = profile.idempotency;
                    }
                }

                this.uniqueDeviceIdentifier = GetDeviceUniqueId();

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    increaseIdempotencyInt = () => {
        this.idempotencyInt += 1;

        // update idempotency in the database
        ProfileRepository.updateIdempotency(this.idempotencyInt);
    };

    /**
     * set accessToken
     */
    setToken(token: string) {
        if (token) {
            this.accessToken = token;
        }
    }

    /**
     * Generate bearer token
     */
    async generateAuthToken() {
        // first increase Idempotency
        this.increaseIdempotencyInt();

        const { accessToken, idempotencyInt, uniqueDeviceIdentifier } = this;
        // generate secret
        const secret = await SHA256(`${accessToken}${uniqueDeviceIdentifier}${idempotencyInt}`);

        return `Bearer ${accessToken}.${idempotencyInt}.${secret}`;
    }

    /* Helper Functions ==================================================================== */

    /**
     * Convert parameters object into query string
     * example.
     *   {foo: 'hi there', bar: { blah: 123, blah: [1, 2, 3] }}
     *   foo=hi there&bar[blah]=123&bar[blah][0]=1&bar[blah][1]=2&bar[blah][2]=3
     */
    serialize = (obj: Object, prefix: string): string => {
        const str: Array<string> = [];

        Object.keys(obj).forEach((p) => {
            const k = prefix ? `${prefix}[${p}]` : p;
            // @ts-ignore
            const v = obj[p];

            str.push(
                v !== null && typeof v === 'object'
                    ? this.serialize(v, k)
                    : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
            );
        });

        return str.join('&');
    };

    /*
    Safely parse response to json
    */
    safeParse = (text: string): object => {
        const obj = JSON.parse(text);

        if (!obj || typeof obj !== 'object') {
            throw ErrorMessages.invalidJson;
        }

        const suspectRx =
            // eslint-disable-next-line max-len
            /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;

        if (text.match(suspectRx)) {
            throw new TypeError('Object contains forbidden prototype property');
        }

        let next = [obj];

        while (next.length) {
            const nodes = next;
            next = [];

            for (const node of nodes) {
                if (Object.prototype.hasOwnProperty.call(node, '__proto__')) {
                    throw new TypeError('Object contains forbidden prototype property');
                }

                // eslint-disable-next-line guard-for-in
                for (const key in node) {
                    const value = node[key];
                    if (value && typeof value === 'object') {
                        next.push(node[key]);
                    }
                }
            }
        }

        return obj;
    };

    /**
     * Sends requests to the API
     */
    fetcher(method: Methods, endpoint: any, params: any, body: object, header: object) {
        /* eslint-disable-next-line  */
        return new Promise(async (resolve, reject) => {
            this.requestCounter += 1;

            // After x seconds, let's call it a day!
            const apiTimedOut = setTimeout(() => reject(ErrorMessages.timeout), this.timeoutSec);

            if (!method || !endpoint) {
                reject(new Error('Missing params (ApiService.fetcher).'));
                return;
            }

            // Build request
            const req = {
                method: method.toUpperCase(),
                headers: {
                    'User-Agent': this.userAgent,
                    'Content-Type': 'application/json',
                },
                body: '',
            };

            if (this.accessToken) {
                // Add Authorization Token
                Object.assign(req.headers, { Authorization: await this.generateAuthToken() });
            }

            if (header) {
                req.headers = merge(req.headers, header);
            }

            // Add Endpoint Params
            let urlParams = '';
            if (params) {
                // Object - eg. /token?username=this&password=0
                if (typeof params === 'object') {
                    // Replace matching params in API routes eg. /recipes/{param}/foo
                    for (const param in params) {
                        if (endpoint.includes(`{${param}}`)) {
                            endpoint = endpoint.split(`{${param}}`).join(params[param]);
                            delete params[param];
                        }
                    }

                    // Check if there's still an 'id' prop, /{id}?
                    if (params.id !== undefined) {
                        if (typeof params.id === 'string' || typeof params.id === 'number') {
                            urlParams = `/${params.id}`;
                            delete params.id;
                        }
                    }

                    // Add the rest of the params as a query string if any left
                    // eslint-disable-next-line
                    Object.keys(params).length > 0 ? (urlParams += `?${this.serialize(params, '')}`) : null;

                    // String or Number - eg. /recipes/23
                } else if (typeof params === 'string' || typeof params === 'number') {
                    urlParams = `/${params}`;
                } else {
                    this.logger.warn('params are not an object!', this.apiUrl + endpoint + urlParams);
                }
            }

            // Add Body
            if (body) {
                if (typeof body === 'object') {
                    req.body = JSON.stringify(body);
                } else {
                    req.body = body;
                }
            }

            const thisUrl = this.apiUrl + endpoint + urlParams;

            // Make the request
            fetch(thisUrl, req)
                .then(async (rawRes) => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);

                    let jsonRes = {};

                    try {
                        const textRes = await rawRes.text();
                        jsonRes = this.safeParse(textRes);
                    } catch (error) {
                        throw ErrorMessages.invalidJson;
                    }

                    // TODO: handle normal error with this.handleError()

                    // Only continue if the header is successful
                    if (rawRes && rawRes.status === 200) {
                        return jsonRes || rawRes;
                    }
                    throw jsonRes || rawRes;
                })
                .then((res) => {
                    // TODO: inspect X-Call-Ref id
                    resolve(res);
                })
                .catch((err) => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);
                    // reject
                    reject(err);
                });
        });
    }
}

/* Export ==================================================================== */
export default new ApiService();
