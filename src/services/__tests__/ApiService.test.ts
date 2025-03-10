/* eslint-disable  */

import fetch from 'fetch-mock';

import { Endpoints } from '@common/constants/endpoints';

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

    describe('Should be able to make requests', () => {
        it(`should call with given data`, async () => {
            await ApiService.fetch(Endpoints.Ping, 'POST', undefined, POST_BODY);
            expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
        });

        it(`should call with given data with arg params`, async () => {
            await ApiService.fetch(Endpoints.LiquidityBoundaries, 'POST', URL_ARGS, POST_BODY);
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ARGS_NORMALIZED}`);
            expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
        });

        it(`should call with given data and URL params`, async () => {
            await ApiService.fetch(Endpoints.Ping, 'POST', URL_PARAMS, URL_PARAMS);
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_PARAM}`);
            expect(fetch.lastOptions()!.body).toBe(JSON.stringify(body));
        });

        it(`should call with given body in string`, async () => {
            await ApiService.fetch(Endpoints.Ping, 'POST', undefined, 'RAW_BODY');
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT}`);
            expect(fetch.lastOptions()!.body).toBe('RAW_BODY');
        });

        it(`should call with action`, async () => {
            await ApiService.fetch(Endpoints.Ping, 'GET', { action: 'update' });
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ACTION}`);
        });

        it(`call with invalid json response`, async () => {
            await expect(ApiService.fetch(Endpoints.Ping, 'GET', { action: 'invalid_json' })).rejects.toMatchObject(
                new ApiError('Response returned is not valid JSON Unexpected token \'i\', "invalid_json" is not valid JSON'),
            );
        });

        it(`call with id`, async () => {
            await ApiService.fetch(Endpoints.Ping, 'GET', { id: 1 });
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);

            await ApiService.fetch(Endpoints.Ping, 'GET', 1);
            expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);
        });

        it(`handle with http error code`, async () => {
            // await ApiService['ping'][method]({ action: '400' }).catch((e) => console.warn(e.message));
            await expect(ApiService.fetch(Endpoints.Ping, 'GET', { action: '400' })).rejects.toMatchObject(
                new ApiError('Api error 400 {"foo":"bar"}'),
            );
        });
    });
});
