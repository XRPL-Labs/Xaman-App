/**
 * Family seed import: secp256k1 (default, omit algorithm) vs ed25519.
 * Suggests ed25519 only when that account is activated and secp is absent.
 * Node failures are inconclusive — not treated as unfunded.
 */
import { derive, XRPL_Account } from 'xrpl-accountlib';

import { lookupLedgerAccount } from './mnemonicImport';

export type FamilySeedAlgorithm = 'secp256k1' | 'ed25519';

export type FamilySeedCurvePick =
    | {
          status: 'ready';
          algorithm: FamilySeedAlgorithm;
          address: string;
          confirm?: {
              algorithm: FamilySeedAlgorithm;
              address: string;
              secpAddress: string;
          };
      }
    | {
          status: 'inconclusive';
          secp: { algorithm: 'secp256k1'; address: string };
          ed: { algorithm: 'ed25519'; address: string };
      };

export const isFamilySeedCurvePickerEligible = (secret?: string): boolean => {
    if (typeof secret !== 'string') {
        return false;
    }

    const trimmed = secret.trim();
    return trimmed.length > 15 && /^s/.test(trimmed) && !/^sed/i.test(trimmed);
};

export const deriveFamilySeedAccount = (secret: string, algorithm?: FamilySeedAlgorithm): XRPL_Account => {
    if (algorithm === 'ed25519') {
        return derive.familySeed(secret, { algorithm: 'ed25519' });
    }

    return derive.familySeed(secret);
};

export const pickFamilySeedCurve = async ({
    secret,
    getAccountInfo,
}: {
    secret: string;
    getAccountInfo: (address: string) => Promise<any>;
}): Promise<FamilySeedCurvePick> => {
    const secp = deriveFamilySeedAccount(secret);
    const ed = deriveFamilySeedAccount(secret, 'ed25519');
    const secpAddress = secp.address as string;
    const edAddress = ed.address as string;

    const [secpState, edState] = await Promise.all([
        lookupLedgerAccount(getAccountInfo, secpAddress),
        lookupLedgerAccount(getAccountInfo, edAddress),
    ]);

    if (secpState === 'unknown' || edState === 'unknown') {
        return {
            status: 'inconclusive',
            secp: { algorithm: 'secp256k1', address: secpAddress },
            ed: { algorithm: 'ed25519', address: edAddress },
        };
    }

    if (edState === 'activated' && secpState === 'absent') {
        return {
            status: 'ready',
            algorithm: 'ed25519',
            address: edAddress,
            confirm: {
                algorithm: 'ed25519',
                address: edAddress,
                secpAddress,
            },
        };
    }

    return {
        status: 'ready',
        algorithm: 'secp256k1',
        address: secpAddress,
    };
};
