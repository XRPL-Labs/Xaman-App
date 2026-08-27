/**
 * Mnemonic import: secp256k1 (default BIP32) vs ed25519 (SLIP-0010).
 * Default handling never sends algorithm so accountlib stays secp256k1.
 */
import { derive, XRPL_Account } from 'xrpl-accountlib';

export const getMnemonicAlgorithm = (account: {
    keypair?: { algorithm?: string | null; publicKey?: string | null };
}): MnemonicAlgorithm => {
    if (account.keypair?.algorithm === 'ed25519' || account.keypair?.publicKey?.startsWith('ED')) {
        return 'ed25519';
    }
    return 'secp256k1';
};

export const createSignableAccount = (imported: {
    address?: string | null;
    keypair?: { publicKey?: string | null; privateKey?: string | null; algorithm?: string | null };
}): XRPL_Account => {
    const publicKey = imported.keypair?.publicKey;
    const privateKey = imported.keypair?.privateKey;
    if (!imported.address || !publicKey || !privateKey) {
        throw new Error('Imported account is missing address or keypair');
    }

    return new XRPL_Account({
        address: imported.address,
        algorithm: getMnemonicAlgorithm(imported),
        keypair: {
            publicKey,
            privateKey,
        },
    });
};

export type MnemonicAlgorithm = 'secp256k1' | 'ed25519';

export type MnemonicDeriveOptions = {
    passphrase?: string;
    accountPath?: string;
    changePath?: string;
    addressIndex?: string | number;
};

export type MnemonicImportPick =
    | { status: 'ready'; algorithm: MnemonicAlgorithm; account: XRPL_Account }
    | { status: 'conflict'; secp: XRPL_Account; ed: XRPL_Account }
    | { status: 'inconclusive'; secp: XRPL_Account; ed: XRPL_Account };

/**
 * Ledger account_info result. `actNotFound` is a definitive negative.
 * Throws, empty payloads, and other RPC errors are unknown — not "unfunded".
 *
 * `activated` only means account_data exists. It does not prove the derived
 * master key still signs (RegularKey + lsfDisableMaster).
 */
export type LedgerAccountPresence = 'activated' | 'absent' | 'unknown';

export const curveChoiceButtonLabel = (curve: string, address?: string | null): string => {
    if (!address) {
        return curve;
    }
    const short = address.length > 6 ? `${address.slice(0, 6)}…` : address;
    return `${curve} ${short}`;
};

export const classifyLedgerAccount = (accountInfo: any): LedgerAccountPresence => {
    if (!accountInfo || typeof accountInfo !== 'object') {
        return 'unknown';
    }
    if (accountInfo.error === 'actNotFound') {
        return 'absent';
    }
    if (accountInfo.account_data) {
        return 'activated';
    }
    return 'unknown';
};

export const lookupLedgerAccount = async (
    getAccountInfo: (address: string) => Promise<any>,
    address: string,
): Promise<LedgerAccountPresence> => {
    try {
        return classifyLedgerAccount(await getAccountInfo(address));
    } catch {
        return 'unknown';
    }
};

const compactOptions = (
    options?: MnemonicDeriveOptions & { algorithm?: MnemonicAlgorithm },
): Record<string, unknown> | undefined => {
    if (!options) {
        return undefined;
    }

    const out: Record<string, unknown> = {};

    if (options.passphrase) {
        out.passphrase = options.passphrase;
    }
    if (options.accountPath) {
        out.accountPath = String(options.accountPath);
    }
    if (options.changePath) {
        out.changePath = String(options.changePath);
    }
    if (options.addressIndex !== undefined && options.addressIndex !== '') {
        const index = Number(options.addressIndex);
        if (Number.isFinite(index)) {
            out.addressIndex = index;
        }
    }
    if (options.algorithm && options.algorithm !== 'secp256k1') {
        out.algorithm = options.algorithm;
    }

    return Object.keys(out).length > 0 ? out : undefined;
};

export const deriveMnemonicAccount = (
    mnemonic: string,
    options?: MnemonicDeriveOptions & { algorithm?: MnemonicAlgorithm },
): XRPL_Account => {
    const compacted = compactOptions(options);
    return compacted ? derive.mnemonic(mnemonic, compacted as any) : derive.mnemonic(mnemonic);
};

export const isLedgerAccountActivated = (accountInfo: any): boolean => {
    return classifyLedgerAccount(accountInfo) === 'activated';
};

export const pickMnemonicImport = async ({
    mnemonic,
    deriveOptions,
    explicitAlgorithm,
    getAccountInfo,
}: {
    mnemonic: string;
    deriveOptions?: MnemonicDeriveOptions;
    explicitAlgorithm?: MnemonicAlgorithm;
    getAccountInfo: (address: string) => Promise<any>;
}): Promise<MnemonicImportPick> => {
    if (explicitAlgorithm) {
        return {
            status: 'ready',
            algorithm: explicitAlgorithm,
            account: deriveMnemonicAccount(mnemonic, { ...deriveOptions, algorithm: explicitAlgorithm }),
        };
    }

    const secp = deriveMnemonicAccount(mnemonic, deriveOptions);
    const ed = deriveMnemonicAccount(mnemonic, { ...deriveOptions, algorithm: 'ed25519' });

    const [secpState, edState] = await Promise.all([
        lookupLedgerAccount(getAccountInfo, secp.address as string),
        lookupLedgerAccount(getAccountInfo, ed.address as string),
    ]);

    if (secpState === 'unknown' || edState === 'unknown') {
        return { status: 'inconclusive', secp, ed };
    }

    if (secpState === 'activated' && edState === 'activated') {
        return { status: 'conflict', secp, ed };
    }

    if (edState === 'activated' && secpState === 'absent') {
        return { status: 'ready', algorithm: 'ed25519', account: ed };
    }

    // Both absent (new / unfunded) or only secp activated → default secp.
    // Unfunded ed25519 is indistinguishable from a new secp account; use the
    // curve switch if that is the intended key.
    return { status: 'ready', algorithm: 'secp256k1', account: secp };
};
