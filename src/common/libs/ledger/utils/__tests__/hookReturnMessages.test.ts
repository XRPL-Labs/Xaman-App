import { formatHookReturnMessages, parseHookReturnMessages } from '../hookReturnMessages';

// https://xahau-testnet.xrplwin.com/tx/59B57D8160AACB0CA5DA046ECA3DC779A27C5AEEB383D0E380F195A532E5699C
const SAMPLE_HOOK_EXECUTIONS = [
    {
        HookExecution: {
            HookAccount: 'rDQa2KGduFnKNK6ooSrsXCYUxaopsrQ6QZ',
            HookExecutionIndex: 0,
            HookReturnCode: '0',
            HookReturnString: '706172616D5F73706F6E67655F626C6F623A206F6B00',
        },
    },
    {
        HookExecution: {
            HookAccount: 'rHRPS4bWYjJZFVk8DYhqzVqwp6gtrAbMFD',
            HookExecutionIndex: 1,
            HookReturnCode: '358',
            HookReturnString: '786168617563617264733A20616E2061747465737420696E766F6B652C2070617373696E672E00',
        },
    },
    {
        HookExecution: {
            HookAccount: 'rHRPS4bWYjJZFVk8DYhqzVqwp6gtrAbMFD',
            HookExecutionIndex: 2,
            HookReturnCode: '1cf',
            HookReturnString: '786168617563617264733A2074686973206163636F756E74206973206E6F74206F6E20746865206174746573746F7220726F6C6C2E00',
        },
    },
];

describe('hookReturnMessages', () => {
    it('decodes every readable hook return, including code 0', () => {
        expect(parseHookReturnMessages(SAMPLE_HOOK_EXECUTIONS)).toEqual([
            { slot: 0, code: '0', text: 'param_sponge_blob: ok' },
            { slot: 1, code: '856', text: 'xahaucards: an attest invoke, passing.' },
            { slot: 2, code: '463', text: 'xahaucards: this account is not on the attestor roll.' },
        ]);
    });

    it('formats one line per slot', () => {
        expect(formatHookReturnMessages(SAMPLE_HOOK_EXECUTIONS)).toBe(
            [
                '[0] param_sponge_blob: ok (#0)',
                '[1] xahaucards: an attest invoke, passing. (#856)',
                '[2] xahaucards: this account is not on the attestor roll. (#463)',
            ].join('\n'),
        );
    });

    it('accepts unwrapped HookExecution arrays from the mutation mixin', () => {
        const unwrapped = SAMPLE_HOOK_EXECUTIONS.map((entry) => entry.HookExecution);
        expect(parseHookReturnMessages(unwrapped)).toHaveLength(3);
        expect(parseHookReturnMessages(unwrapped)[2].text).toBe(
            'xahaucards: this account is not on the attestor roll.',
        );
    });

    it('returns empty for missing or non-readable payloads', () => {
        expect(parseHookReturnMessages(undefined)).toEqual([]);
        expect(parseHookReturnMessages([])).toEqual([]);
        expect(
            parseHookReturnMessages([
                { HookExecution: { HookExecutionIndex: 0, HookReturnCode: '1', HookReturnString: 'ffff' } },
            ]),
        ).toEqual([]);
    });
});
