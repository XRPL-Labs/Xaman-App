import { txFlags, txFlagIndices } from './flags/txFlags';

/* Class ==================================================================== */
class Flag {
    type: string;
    flags: number;

    constructor(type: string, flags?: number) {
        this.type = type;
        this.flags = flags;
    }

    parseIndices() {
        let flag = '';
        const { AccountSet } = txFlagIndices;

        for (const flagName in AccountSet) {
            // @ts-ignore
            if (this.flags === AccountSet[flagName]) {
                flag = flagName;
            }
        }
        return flag;
    }

    parse() {
        let flagsList = {} as any;

        switch (this.type) {
            case 'AccountSet':
                flagsList = txFlags.AccountSet;
                break;
            case 'TrustSet':
                flagsList = txFlags.TrustSet;
                break;
            case 'OfferCreate':
                flagsList = txFlags.OfferCreate;
                break;
            case 'Payment':
                flagsList = txFlags.Payment;
                break;
            case 'PaymentChannelClaim':
                flagsList = txFlags.PaymentChannelClaim;
                break;
            case 'NFTokenMint':
                flagsList = txFlags.NFTokenMint;
                break;
            case 'NFTokenCreateOffer':
            case 'NFTokenOffer':
                flagsList = txFlags.NFTokenCreateOffer;
                break;
            default:
                break;
        }

        const settings = {} as any;

        // parse transaction flags
        for (const flagName in flagsList) {
            if (this.flags & flagsList[flagName]) {
                settings[flagName] = true;
            } else {
                settings[flagName] = false;
            }
        }

        // parse universal flags
        for (const flagName in txFlags.Universal) {
            // @ts-ignore
            if (this.flags & txFlags.Universal[flagName]) {
                settings[flagName] = true;
            } else {
                settings[flagName] = false;
            }
        }

        return settings;
    }

    get(): number {
        return this.flags;
    }

    set(flag: number) {
        if (!this.flags) {
            this.flags = flag;
        } else {
            this.flags |= flag;
            /* eslint-disable-next-line spellcheck/spell-checker */
            // JavaScript converts operands to 32-bit signed ints before doing bitwise
            // operations. We need to convert it back to an unsigned int.
            this.flags >>>= 0;
        }

        return this.flags;
    }
}

/* Export ==================================================================== */
export default Flag;
