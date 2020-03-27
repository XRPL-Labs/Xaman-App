/* eslint-disable keyword-spacing  */
/* eslint-disable implicit-arrow-linebreak  */

/**
 * API Functions
 */

import merge from 'lodash/merge';
import DeviceInfo from 'react-native-device-info';

import { CoreRepository, ProfileRepository } from '@store/repositories';
import { SHA256 } from '@common/libs/crypto';
import { AppConfig, ErrorMessages, APIConfig } from '@common/constants';

import { LoggerService } from '@services';

/* Types  ==================================================================== */
type Methods = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/* Service  ==================================================================== */
class ApiService {
    apiUrl: string;
    endpoints: Map<string, string>;
    idempotencyInt: number;
    userAgent: string;
    debug: boolean;
    requestCounter: number;
    accessToken: string;
    uniqueDeviceIdentifier: string;
    logger: any;
    increaseIdempotency: () => void;
    [index: string]: any;

    constructor() {
        // Config
        this.apiUrl = APIConfig.apiUrl;
        this.userAgent = `${AppConfig.appName}`;
        this.endpoints = APIConfig.endpoints;

        // Enable debug output when in Debug mode
        this.debug = AppConfig.DEV;

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

    initialize() {
        return new Promise((resolve, reject) => {
            try {
                // if the app is initialized and the access token set
                const core = CoreRepository.getSettings();
                const profile = ProfileRepository.getProfile();

                if (core && profile) {
                    if (core.initialized && profile.accessToken) {
                        this.accessToken = profile.accessToken;
                        this.idempotencyInt = profile.idempotency;
                    }
                }

                this.uniqueDeviceIdentifier = DeviceInfo.getUniqueId();

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    }

    increaseIdempotencyInt = () => {
        this.idempotencyInt += 1;

        // Increase idempotencyInt
        ProfileRepository.increaseIdempotency();
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
     * Sends requests to the API
     */
    static handleError(err: any) {
        let error = '';
        if (typeof err === 'string') {
            error = err;
        } else if (err.error) {
            error = err.error.message;
        }

        if (!err) {
            error = ErrorMessages.default;
        }
        return error;
    }

    /**
     * Convert parameters object into query string
     * example.
     *   {foo: 'hi there', bar: { blah: 123, blah: [1, 2, 3] }}
     *   foo=hi there&bar[blah]=123&bar[blah][0]=1&bar[blah][1]=2&bar[blah][2]=3
     */
    serialize(obj: Object, prefix: string) {
        const str: Array<string> = [];

        Object.keys(obj).forEach(p => {
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
    }

    /**
     * Sends requests to the API
     */
    fetcher(method: Methods, endpoint: any, params: any, body: object, header: object) {
        /* eslint-disable-next-line  */
        return new Promise(async (resolve, reject) => {
            this.requestCounter += 1;

            // After x seconds, let's call it a day!
            const timeoutAfter = 100;
            const apiTimedOut = setTimeout(() => reject(ErrorMessages.timeout), timeoutAfter * 1000);

            if (!method || !endpoint) {
                return reject(new Error('Missing params (ApiService.fetcher).'));
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

            if (header) {
                req.headers = merge(req.headers, header);
            } else if (this.accessToken) {
                // Add Authorization Token
                // @ts-ignore
                req.headers.Authorization = await this.generateAuthToken();
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

                    // Something else? Just log an error
                } else {
                    this.logger.warn(
                        "You provided params, but it wasn't an object!",
                        this.apiUrl + endpoint + urlParams,
                    );
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
            return fetch(thisUrl, req)
                .then(async rawRes => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);

                    let jsonRes = {};

                    try {
                        jsonRes = await rawRes.json();
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
                .then(res => {
                    // TODO: inspect X-Call-Ref id
                    return resolve(res);
                })
                .catch(err => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);

                    this.logger.error(this.apiUrl + endpoint + urlParams, err);
                    return reject(err);
                });
        });
    }
}

/* Export ==================================================================== */
export default new ApiService();
