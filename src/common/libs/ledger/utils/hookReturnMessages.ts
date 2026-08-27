/**
 * Decode Xahau HookExecutions into human-readable return messages.
 * Used on event details and post-submit result screens.
 */

export interface HookReturnMessage {
    slot: number;
    code: string;
    text: string;
}

const READABLE = /^[a-zA-Z0-9_\-+*^.()[\]:,;!?\s ]+$/;

const unwrapExecution = (entry: any): any => {
    if (entry && typeof entry === 'object' && entry.HookExecution && typeof entry.HookExecution === 'object') {
        return entry.HookExecution;
    }
    return entry;
};

const signedReturnCode = (raw: unknown): string => {
    try {
        let val: bigint;
        if (typeof raw === 'number' && Number.isFinite(raw)) {
            val = BigInt(raw);
        } else {
            const hex = String(raw ?? '0').replace(/^0x/i, '');
            val = BigInt(`0x${hex || '0'}`);
        }
        const signed = val >> 63n ? -(val & ~(1n << 63n)) : val;
        return signed.toString();
    } catch {
        return String(raw ?? '0');
    }
};

const decodeReturnString = (raw: unknown): string => {
    const hex = String(raw || '').replace(/(00)+$/g, '');
    if (!hex || hex.length % 2 !== 0) {
        return '';
    }
    try {
        return Buffer.from(hex, 'hex').toString('utf-8').replace(/\0/g, '').trim();
    } catch {
        return '';
    }
};

export const parseHookReturnMessages = (executions?: unknown): HookReturnMessage[] => {
    if (!Array.isArray(executions)) {
        return [];
    }

    const messages: HookReturnMessage[] = [];

    executions.forEach((entry, index) => {
        const exec = unwrapExecution(entry);
        if (!exec || typeof exec !== 'object') {
            return;
        }

        const text = decodeReturnString(exec.HookReturnString);
        if (!text || !READABLE.test(text)) {
            return;
        }

        const slotRaw = exec.HookExecutionIndex;
        const slot = typeof slotRaw === 'number' && Number.isFinite(slotRaw) ? slotRaw : index;

        messages.push({
            slot,
            code: signedReturnCode(exec.HookReturnCode),
            text,
        });
    });

    return messages;
};

export const formatHookReturnLine = (message: HookReturnMessage): string => {
    return `[${message.slot}] ${message.text} (#${message.code})`;
};

export const formatHookReturnMessages = (executions?: unknown): string => {
    return parseHookReturnMessages(executions).map(formatHookReturnLine).join('\n');
};
