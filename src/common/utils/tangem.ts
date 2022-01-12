import { has, get, first, keys, isPlainObject } from 'lodash';

import { Card, EllipticCurve, OptionsSign } from 'tangem-sdk-react-native';

// eslint-disable-next-line quotes
const DefaultDerivationPaths = "m/44'/144'/0'/0/0";

/**
 * get prefer curve base on card supported curves
 */
const GetPreferCurve = (supportedCurves: Array<EllipticCurve>): EllipticCurve => {
    // default prefered curve
    const defaultCurve = EllipticCurve.Secp256k1;

    if (!Array.isArray(supportedCurves) || supportedCurves.length === 0) {
        return defaultCurve;
    }

    // only supports one curve
    if (supportedCurves.length === 1) {
        return supportedCurves[0];
    }

    // support multi curve return default if exist
    if (supportedCurves.indexOf(defaultCurve) > -1) {
        return defaultCurve;
    }

    // return first supported curve
    return supportedCurves[0];
};

/**
 * get card wallet public key
 */
const GetWalletPublicKey = (card: Card): string => {
    if (has(card, 'wallets')) {
        const { wallets } = card;

        // normal cards
        if (Array.isArray(wallets) && wallets.length > 0) {
            // get the first wallet
            const wallet = first(wallets);
            // return wallet pub key
            return wallet.publicKey;
        }
    }

    // older version of tangem SDK
    if (has(card, 'walletPublicKey')) {
        // @ts-ignore
        const { walletPublicKey } = card;
        return walletPublicKey;
    }

    throw new Error('Unable to found walletPublicKey in card data!');
};

/**
 * get card wallet derived public key
 * NOTE: for deriving the address from pubKey this method should be used
 */
const GetWalletDerivedPublicKey = (card: Card): string => {
    const { settings, wallets } = card;

    // if multi currency card get pub key from derived keys
    if (get(settings, 'isHDWalletAllowed', false)) {
        const wallet = first(wallets);
        const derivedKeys = get(wallet, 'derivedKeys');

        // response from android SDK is different than iOS
        let derivedKey;

        // android
        if (isPlainObject(derivedKeys)) {
            const key = first(keys(derivedKeys));
            try {
                const keyJSON = JSON.parse(key);
                if (get(keyJSON, 'rawPath') === DefaultDerivationPaths) {
                    derivedKey = get(derivedKeys, key);
                }
            } catch (e) {
                // ignore
            }
        }

        // ios
        // @ts-ignore
        if (Array.isArray(derivedKeys) && derivedKeys.length === 2 && first(derivedKeys) === DefaultDerivationPaths) {
            derivedKey = get(derivedKeys, '[1]');
        }

        if (!get(derivedKey, 'publicKey')) {
            throw new Error('HDWallet, No derived keys present in the card');
        }
        return derivedKey.publicKey;
    }

    // normal card
    return GetWalletPublicKey(card);
};

/**
 * get card passcode status
 */
const GetCardPasscodeStatus = (card: any): boolean => {
    if (has(card, 'isPasscodeSet')) {
        return card.isPasscodeSet;
    }
    // older version of tangem sdk
    if (has(card, 'isPin2Default')) {
        // @ts-ignore
        return !card.isPin2Default;
    }

    throw new Error('Unable to get card passcode status base on card data!');
};

/**
 * get card ID
 */
const GetCardId = (card: any): string => {
    if (has(card, 'cardId')) {
        return card.cardId;
    }
    throw new Error('Unable to found cardId in card data!');
};

/**
 * get sign options base on wallet HD wallet support
 */
const GetSignOptions = (card: Card, hashToSign: string): OptionsSign => {
    const { settings } = card;

    const options = {
        cardId: GetCardId(card),
        walletPublicKey: GetWalletPublicKey(card),
        hashes: [hashToSign],
    } as OptionsSign;

    // multi currency card
    if (get(settings, 'isHDWalletAllowed', false)) {
        Object.assign(options, {
            derivationPath: DefaultDerivationPaths,
        });
    }

    return options;
};

const GetHDWalletStatus = (card: Card): boolean => {
    const { settings } = card;
    return get(settings, 'isHDWalletAllowed', false);
};

export {
    GetPreferCurve,
    GetWalletPublicKey,
    GetCardPasscodeStatus,
    GetCardId,
    GetWalletDerivedPublicKey,
    GetHDWalletStatus,
    GetSignOptions,
    DefaultDerivationPaths,
};
