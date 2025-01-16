import BigNumber from 'bignumber.js';

import { sign, derive, XrplDefinitions } from 'xrpl-accountlib';

/**
 * Prepare transaction for getting hook tx fee
 * @param txJson
 * @param definitions
 * @param networkId
 * @returns string
 */
const PrepareTxForHookFee = (txJson: any, definitions: XrplDefinitions | undefined, networkId: number): string => {
    if (!txJson || typeof txJson !== 'object') {
        throw new Error('PrepareTxForHookFee requires a json transaction to calculate the fee for');
    }

    // Shallow copy txJson
    // Fee and SigningPubKey should be empty
    const transaction = {
        ...txJson,
        Fee: '0',
        SigningPubKey: '',
    };

    // check if we need to populate the transaction with dummy details
    // set the Sequence if not set
    if (!Object.prototype.hasOwnProperty.call(transaction, 'Sequence')) {
        Object.assign(transaction, {
            Sequence: 0,
        });
    }

    // include Network ID if necessary
    if (!Object.prototype.hasOwnProperty.call(transaction, 'NetworkID')) {
        // legacy networks have ids less than 1024, these networks cannot specify NetworkID in txn
        if (networkId > 1024) {
            Object.assign(transaction, {
                NetworkID: networkId,
            });
        }
    }

    // Payment payloads can have no amount set
    if (transaction.TransactionType === 'Payment' && !transaction.Amount) {
        Object.assign(transaction, {
            Amount: '0',
        });
    }

    // sign the transaction with a dummy account
    return sign(transaction, derive.passphrase(''), definitions).signedTransaction;
};

/**
 * Calculate the available fees base on current network fee data set
 * @param feeDataSet
 * @returns object
 */
const NormalizeFeeDataSet = (feeDataSet: {
    drops: { base_fee: string };
    fee_hooks_feeunits: string;
}): {
    availableFees: {
        type: 'LOW' | 'MEDIUM' | 'HIGH';
        value: string;
    }[];
    feeHooks: number;
    suggested: 'LOW';
} => {
    if (!feeDataSet || typeof feeDataSet !== 'object') {
        throw new Error('NormalizeFeeDataSet required a valid fee data set!');
    }
    const { drops: { base_fee } = { base_fee: 12 }, fee_hooks_feeunits = 0 } = feeDataSet;

    const baseFee = BigNumber.maximum(12, base_fee);
    const feeHooks = BigNumber.maximum(new BigNumber(fee_hooks_feeunits).minus(baseFee), 0).toNumber();

    const feeCalc = (level: number) => {
        let nearest = new BigNumber(1);
        let multiplier = new BigNumber(100);

        if (level > 0) {
            nearest = new BigNumber(0.5).multipliedBy(10 ** (baseFee.toString(10).length - 1));
            multiplier = new BigNumber(100).plus(
                level ** new BigNumber(2.1).minus(baseFee.multipliedBy(0.000005)).toNumber(),
            );
        }

        return baseFee
            .dividedBy(100)
            .multipliedBy(multiplier)
            .dividedBy(nearest)
            .integerValue(BigNumber.ROUND_CEIL)
            .multipliedBy(nearest)
            .toFixed(0, BigNumber.ROUND_UP);
    };

    return {
        availableFees: [
            {
                type: 'LOW',
                value: feeCalc(0),
            },
            {
                type: 'MEDIUM',
                value: feeCalc(4),
            },
            {
                type: 'HIGH',
                value: feeCalc(8),
            },
        ],
        feeHooks,
        suggested: 'LOW',
    };
};

export { NormalizeFeeDataSet, PrepareTxForHookFee };
