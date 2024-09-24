/* eslint-disable  */

import fetch from 'fetch-mock';

import { ApiService } from '../';
import { ApiError } from '../ApiService';

const API_ROOT = 'https://xaman.app/api';
const ENDPOINT = '/v1/app/ping';
const ENDPOINT_WITH_PARAM = '/v1/app/ping?foo=bar';
const ENDPOINT_WITH_ARGS = '/v1/app/liquidity-boundaries/{issuer}/{currency}';
const ENDPOINT_WITH_ARGS_NORMALIZED = ENDPOINT_WITH_ARGS.replace('{issuer}', 'foo').replace('{currency}', 'bar');
const ENDPOINT_WITH_ID = '/v1/app/ping/1';
const ENDPOINT_WITH_ACTION = '/v1/app/ping?action=update';
const ENDPOINT_INVALID_JSON = '/v1/app/ping?action=invalid_json';
const ENDPOINT_HTTP_ERROR = '/v1/app/ping?action=400';
const URL_PARAMS = { foo: 'bar' };
const URL_ARGS = { issuer: 'foo', currency: 'bar' };
const POST_BODY = { foo: 'bar' };

jest.mock('@services/NetworkService');

describe('API', () => {
    beforeEach(() => {
        fetch
            .mock(API_ROOT + ENDPOINT, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_WITH_PARAM, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_WITH_ARGS_NORMALIZED, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_WITH_ID, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_WITH_ACTION, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_INVALID_JSON, { status: 200, body: 'invalid_json' })
            .mock(API_ROOT + ENDPOINT_HTTP_ERROR, { status: 400, body: POST_BODY });
    });

    afterEach(() => {
        fetch.restore();
    });

    const body = { foo: 'bar' };

    for (const method of ['put', 'post', 'get', 'delete', 'patch']) {
        describe(method.toUpperCase(), () => {
            it(`should ${method} given data`, async () => {
                await ApiService['ping'][method](undefined, POST_BODY);
                expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
            });

            it(`should ${method} given data with arg params`, async () => {
                await ApiService['liquidityBoundaries'][method](URL_ARGS, POST_BODY);
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ARGS_NORMALIZED}`);
                expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
            });

            it(`should ${method} given data with URL params`, async () => {
                await ApiService['ping'][method](URL_PARAMS, POST_BODY);
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_PARAM}`);
                expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
            });

            it(`should ${method} given body in string`, async () => {
                await ApiService['ping'][method](undefined, 'body');
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT}`);
                expect(fetch.lastOptions()!.body).toBe('body');
            });

            it(`should ${method} with action`, async () => {
                await ApiService['ping'][method]({ action: 'update' });
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ACTION}`);
            });

            it(`${method} with invalid json response`, async () => {
                await expect(ApiService['ping'][method]({ action: 'invalid_json' })).rejects.toMatchObject(
                    new ApiError('Response returned is not valid JSON'),
                );
            });

            it(`${method} with id`, async () => {
                await ApiService['ping'][method]({ id: 1 });
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);

                await ApiService['ping'][method](1);
                expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);
            });

            it(`${method} with http error code`, async () => {
                // await ApiService['ping'][method]({ action: '400' }).catch((e) => console.warn(e.message));
                await expect(ApiService['ping'][method]({ action: '400' })).rejects.toMatchObject(
                    new ApiError('Api error {"foo":"bar"}'),
                );
            });
        });
    }
});
