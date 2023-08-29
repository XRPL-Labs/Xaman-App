import BigNumber from 'bignumber.js';

import { sign, derive, XrplDefinitions } from 'xrpl-accountlib';

/**
 * Prepare transaction for getting hook tx fee
 * @param txJson
 * @param definitions
 * @returns string
 */
const PrepareTxForHookFee = (txJson: any, definitions: any): string => {
    if (!txJson || typeof txJson !== 'object') {
        throw new Error('PrepareTxForHookFee requires a json transaction to calculate the fee for');
    }

    // normalize the transaction
    // Fee and SigningPubKey should be empty
    const transaction = {
        ...txJson,
        Fee: '0',
        SigningPubKey: '',
    };

    // check if we need to populate the transaction with dummy details
    // set the Sequence if not set
    if (!Object.prototype.hasOwnProperty.call(txJson, 'Sequence')) {
        Object.assign(transaction, {
            Sequence: 0,
        });
    }

    // Payment payloads can have no amount set
    if (txJson.TransactionType === 'Payment' && !txJson.Amount) {
        Object.assign(transaction, {
            Amount: '0',
        });
    }

    // set the definitions if exist
    let xrplDefinitions;
    if (typeof definitions === 'object') {
        xrplDefinitions = new XrplDefinitions(definitions);
    }

    // sign the transaction with a dummy account
    return sign(transaction, derive.passphrase(''), xrplDefinitions).signedTransaction;
};

/**
 * Calculate the available fees base on current network fee data set
 * @param feeDataSet
 * @returns object
 */
const NormalizeFeeDataSet = (feeDataSet: any) => {
    if (!feeDataSet || typeof feeDataSet !== 'object') {
        throw new Error('NormalizeFeeDataSet required a valid fee data set!');
    }
    // set the suggested fee base on queue percentage
    const { drops: { base_fee } = { base_fee: 15 }, fee_hooks_feeunits: fee_hooks } = feeDataSet;

    const baseFee = new BigNumber(base_fee);

    const addPercentage = (value: BigNumber, percentage: number) => {
        return value.plus(value.multipliedBy(percentage).dividedBy(100)).toFixed(0, BigNumber.ROUND_UP);
    };

    // LOW -> 0%
    // MEDIUM -> +5%
    // HIGH -> +10%
    return {
        availableFees: [
            {
                type: 'LOW',
                value: addPercentage(baseFee, 0),
            },
            {
                type: 'MEDIUM',
                value: addPercentage(baseFee, 5),
            },
            {
                type: 'HIGH',
                value: addPercentage(baseFee, 10),
            },
        ],
        feeHooks: fee_hooks || 0,
        suggested: 'MEDIUM',
    };
};

export { NormalizeFeeDataSet, PrepareTxForHookFee };
