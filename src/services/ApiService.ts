/* eslint-disable keyword-spacing  */
/* eslint-disable implicit-arrow-linebreak  */
/* eslint-disable max-classes-per-file  */

/**
 * API Functions
 */

// TODO: refactor refresh token mechanism prevent multiple calling the refresh token

import merge from 'lodash/merge';

import { ProfileRepository } from '@store/repositories';
import { CoreModel } from '@store/models';

import { SHA256 } from '@common/libs/crypto';
import { AppConfig, ApiConfig, ErrorMessages } from '@common/constants';

import { GetDeviceUniqueId } from '@common/helpers/device';

import LoggerService, { LoggerInstance } from '@services/LoggerService';
import NetworkService from '@services/NetworkService';
import Localize from '@locale';

/* Types  ==================================================================== */
type Methods = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/* Errors  ==================================================================== */
export class ApiError extends Error {
    public code: number;
    public reference?: string;
    private originalMessage: string;

    constructor(message: string, code?: number, reference?: string) {
        super();
        this.name = 'ApiError';
        this.originalMessage = message;
        this.code = code || -1;
        this.reference = reference;
    }

    /**
     * Retrieves the message associated with the current error response.
     *
     * @return {string} The error message.
     */
    get message() {
        switch (this.code) {
            // generic errors
            // we got a payment required error from backend
            case 402:
                return Localize.t('monetization.monetizationRequiredForThisFeature');
            default:
                return this.originalMessage;
        }
    }
}

/* Service  ==================================================================== */
class ApiService {
    private readonly apiUrl: string;
    private readonly userAgent: string;
    private readonly timeoutSec: number;
    private endpoints: Map<string, string>;
    private idempotencyInt: number;
    private accessToken?: string;
    private bearerHash?: string;
    private uniqueDeviceIdentifier?: string;
    private isRefreshingToken: boolean;
    private logger: LoggerInstance;

    [index: string]: any;

    constructor() {
        // Config
        this.apiUrl = ApiConfig.apiUrl;
        this.userAgent = `${AppConfig.appName}`;
        this.endpoints = ApiConfig.endpoints;

        // After 100 seconds, let's call it a day!
        this.timeoutSec = 100 * 1000;

        // Api accessToken
        this.accessToken = undefined;
        this.bearerHash = undefined;
        this.idempotencyInt = 0;
        this.isRefreshingToken = false;

        this.uniqueDeviceIdentifier = undefined;

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

    public initialize(coreSettings: CoreModel) {
        return new Promise<void>((resolve, reject) => {
            try {
                // if the app is initialized and the access token set
                if (coreSettings && coreSettings.initialized) {
                    // get current profile
                    const profile = ProfileRepository.getProfile();

                    // app is setup and there auth token
                    if (profile) {
                        // if no refresh/bearer token then fetch it as this is a feature that recently added
                        if (!profile.refreshToken) {
                            this.updateRefreshToken();
                        }

                        this.accessToken = profile.accessToken;
                        this.bearerHash = profile.bearerHash;
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

    /**
     * set accessToken
     */
    public setToken(token: string) {
        if (token) {
            this.accessToken = token;
        }
    }

    /**
     * set bearer hash
     */
    public setBearerHash(bearerHash: string) {
        if (bearerHash) {
            this.bearerHash = bearerHash;
        }
    }

    /**
     * Generate bearer token
     */
    private async generateAuthToken() {
        // first increase Idempotency
        this.idempotencyInt += 1;

        // update idempotency in the data store
        ProfileRepository.updateIdempotency(this.idempotencyInt);

        const { accessToken, bearerHash, idempotencyInt, uniqueDeviceIdentifier } = this;

        // generate secret
        const secret = await SHA256(`${accessToken}${uniqueDeviceIdentifier}${idempotencyInt}`);

        // generate legacy authentication header
        let authentication = `${accessToken}.${idempotencyInt}.${secret}`;

        // if bearer hash is exist, add it to the header
        if (bearerHash) {
            authentication = `${authentication}.${bearerHash}`;
        }

        return `Bearer ${authentication}`;
    }

    /*
    Re-fetch the refresh token as it's been expired
    */
    private updateRefreshToken = () => {
        // set the flag
        this.isRefreshingToken = true;

        // get current profile
        const profile = ProfileRepository.getProfile();

        const postData = {};

        // include the prev bear hash to the request
        if (profile?.bearerHash) {
            Object.assign(postData, { refresh_token: profile.refreshToken });
        }

        // fetch the new refresh token from backend
        return this.refreshToken
            .post(null, postData)
            .then((res: any) => {
                const { refresh_token, bearer_hash } = res;

                // check if current refresh token is different then save
                if (refresh_token && refresh_token !== profile?.refreshToken) {
                    // store the new refresh token
                    ProfileRepository.saveProfile({
                        refreshToken: refresh_token,
                        bearerHash: bearer_hash,
                    });
                    // set the new token on the service
                    this.setBearerHash(bearer_hash);
                }
            })
            .catch((error: any) => {
                this.logger.error('Refresh access token error: ', error);
            })
            .finally(() => {
                this.isRefreshingToken = false;
            });
    };

    /**
     * Wait for refresh token if we already fetching it
     */
    private waitForRefreshToken = (ignore: boolean): Promise<void> => {
        return new Promise((resolve) => {
            if (ignore) {
                resolve();
                return;
            }
            const interval = setInterval(() => {
                if (!this.isRefreshingToken) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    };

    /* Helper Functions ==================================================================== */

    /**
     * Convert parameters object into query string
     * example.
     *   {foo: 'hi there', bar: { blah: 123, blah: [1, 2, 3] }}
     *   foo=hi there&bar[blah]=123&bar[blah][0]=1&bar[blah][1]=2&bar[blah][2]=3
     */
    private serialize = (obj: Record<string, any>, prefix: string): string => {
        const str: Array<string> = [];

        Object.keys(obj).forEach((p) => {
            const k = prefix ? `${prefix}[${p}]` : p;
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
    private safeParse = (text: string): object => {
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
    fetcher(method: Methods, endpoint: any, params: any, body: object, header: object, retried = 0) {
        /* eslint-disable-next-line  */
        return new Promise(async (resolve, reject) => {
            // check if this is a refresh token request
            const isRefreshTokenRequest = endpoint === this.endpoints.get('refreshToken');
            // increase retrying request
            retried += 1;

            // we don't want to loop this if something goes wrong, so we may only try it 3 times
            // this should never happen
            if (retried >= 3) {
                reject(new ApiError('Tried the request multiple time, giving up...'));
                return;
            }

            // wait for refresh token to be ready if we are already fetching new one
            // we only do this for not refresh token endpoint
            await this.waitForRefreshToken(isRefreshTokenRequest);

            // After x seconds, let's call it a day!
            const apiTimedOut = setTimeout(() => reject(ErrorMessages.timeout), this.timeoutSec);

            if (!method || !endpoint) {
                reject(new ApiError('Missing params (ApiService.fetcher).'));
                return;
            }

            // Build request
            const req = {
                method: method.toUpperCase(),
                headers: {
                    'User-Agent': this.userAgent,
                    'Content-Type': 'application/json',
                    'X-Xaman-Net': NetworkService.getNetwork()?.key,
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
            let urlEndpoint = endpoint;
            const paramsClone = typeof params === 'object' ? { ...params } : params;

            if (paramsClone) {
                // Object - eg. /token?username=this&password=0
                if (typeof paramsClone === 'object') {
                    // Replace matching params in API routes eg. /recipes/{param}/foo
                    for (const param in paramsClone) {
                        if (urlEndpoint.includes(`{${param}}`)) {
                            urlEndpoint = urlEndpoint.split(`{${param}}`).join(paramsClone[param]);
                            delete paramsClone[param];
                        }
                    }

                    // Check if there's still an 'id' prop, /{id}?
                    if (paramsClone.id !== undefined) {
                        if (typeof paramsClone.id === 'string' || typeof paramsClone.id === 'number') {
                            urlParams = `/${paramsClone.id}`;
                            delete paramsClone.id;
                        }
                    }

                    // Add the rest of the params as a query string if any left
                    // eslint-disable-next-line
                    Object.keys(paramsClone).length > 0 ? (urlParams += `?${this.serialize(paramsClone, '')}`) : null;

                    // String or Number - eg. /recipes/23
                } else if (typeof paramsClone === 'string' || typeof paramsClone === 'number') {
                    urlParams = `/${paramsClone}`;
                } else {
                    this.logger.warn('params are not an object!', this.apiUrl + urlEndpoint + urlParams);
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

            const thisUrl = this.apiUrl + urlEndpoint + urlParams;

            // Make the request
            fetch(thisUrl, req)
                .then(async (rawRes) => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);

                    let jsonRes = {} as any;

                    try {
                        const textRes = await rawRes.text();
                        jsonRes = this.safeParse(textRes);
                    } catch (error) {
                        throw new ApiError(ErrorMessages.invalidJson);
                    }

                    // Only continue if the header is successful
                    if (rawRes && rawRes.status === 200) {
                        return jsonRes || rawRes;
                    }

                    // handle error
                    if (typeof jsonRes === 'object' && Object.prototype.hasOwnProperty.call(jsonRes, 'error')) {
                        throw new ApiError(
                            `Api error ${rawRes.status}`,
                            jsonRes?.error?.code,
                            jsonRes?.error?.reference,
                        );
                    }

                    // anything else just throw
                    throw new ApiError(`Api error ${(jsonRes && JSON.stringify(jsonRes)) || rawRes}`);
                })
                .then((res) => {
                    resolve(res);
                })
                .catch(async (error: ApiError) => {
                    // API got back to us, clear the timeout
                    clearTimeout(apiTimedOut);

                    // if rejection was caused by token expiration then try to refresh the token and try again
                    // if not refreshing the token, start refreshing
                    // ignore the refresh token request as it will end in loop
                    if (error.code === 890 && !isRefreshTokenRequest) {
                        if (!this.isRefreshingToken) {
                            // wait for refresh token to be updated
                            await this.updateRefreshToken();
                        }

                        // call the request again
                        setTimeout(() => {
                            this.fetcher(method, endpoint, params, body, header, retried).then(resolve).catch(reject);
                        }, 100);

                        // return
                        return;
                    }

                    // hard reject
                    reject(error);
                });
        });
    }
}

/* Export ==================================================================== */
export default new ApiService();
