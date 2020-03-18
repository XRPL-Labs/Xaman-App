/* eslint-disable  */

// @ts-ignore
import fetch from 'fetch-mock';

import { ApiService } from '../';

const API_ROOT = 'https://xumm.app/api';
const ENDPOINT = '/v1/app/ping';
const ENDPOINT_WITH_PARAM = '/v1/app/ping?foo=bar';
const ENDPOINT_WITH_ID = '/v1/app/ping/1';
const ENDPOINT_WITH_ACTION = '/v1/app/ping?action=update';
const ENDPOINT_INVALID_JSON = '/v1/app/ping?action=invalid_json';
const ENDPOINT_HTTP_ERROR = '/v1/app/ping?action=400';
const URL_PARAMS = { foo: 'bar' };
const POST_BODY = { foo: 'bar' };

describe('API', () => {
    beforeEach(() => {
        ApiService.APIURL = API_ROOT;

        fetch
            .mock(API_ROOT + ENDPOINT, { status: 200, body: POST_BODY })
            .mock(API_ROOT + ENDPOINT_WITH_PARAM, { status: 200, body: POST_BODY })
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
            if (method === 'put' || method === 'post') {
                it(`should ${method} given data`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method](undefined, POST_BODY);
                    expect(fetch.lastOptions().body).toBe(JSON.stringify(body));
                });

                it(`should ${method} given data with URL params`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method](URL_PARAMS, POST_BODY);
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_PARAM}`);
                    expect(fetch.lastOptions().body).toBe(JSON.stringify(body));
                });

                it(`should ${method} given body in string`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method](undefined, 'body');
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT}`);
                    expect(fetch.lastOptions().body).toBe('body');
                });

                it(`should ${method} with action`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method]({ action: 'update' });
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ACTION}`);
                });

                it(`${method} with invalid json response`, async () => {
                    // @ts-ignore
                    expect(ApiService['ping'][method]({ action: 'invalid_json' })).rejects.toMatch(
                        'Response returned is not valid JSON',
                    );
                });
            } else {
                it(`${method} with URL params`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method](URL_PARAMS, POST_BODY);
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_PARAM}`);
                    expect(fetch.lastOptions().body).toBe(JSON.stringify(body));
                });

                it(`${method} with id`, async () => {
                    // @ts-ignore
                    await ApiService['ping'][method]({ id: 1 });
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);

                    await ApiService['ping'][method](1);
                    expect(fetch.lastUrl()).toBe(`${API_ROOT}${ENDPOINT_WITH_ID}`);
                });

                it(`${method} with http error code`, async () => {
                    // @ts-ignore
                    expect(ApiService['ping'][method]({ action: '400' })).rejects.toMatch(
                        'Response returned is not valid JSON',
                    );
                });
            }
        });
    }
});
