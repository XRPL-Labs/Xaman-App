import { Card, EllipticCurve } from 'tangem-sdk-react-native';

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

const GetWalletPublicKey = (card: Card): string => {
    const { wallets } = card;

    if (Array.isArray(wallets) && wallets.length > 0) {
        const { publicKey } = wallets[0];

        return publicKey;
    }
    throw new Error('Card does not contain wallet!');
};

const GetCardPasscodeStatus = (card: any): boolean => {
    if (Object.prototype.hasOwnProperty.call(card, 'isPasscodeSet')) {
        return card.isPasscodeSet;
    }

    // older version of tangem sdk
    if (Object.prototype.hasOwnProperty.call(card, 'isPin2Default')) {
        return card.isPin2Default;
    }

    return false;
};

export { GetPreferCurve, GetWalletPublicKey, GetCardPasscodeStatus };
