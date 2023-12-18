/* eslint-disable @typescript-eslint/no-unused-vars */

import { PseudoTransactionTypes, TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/**
 * Abstract Class Digest.
 *
 * @class Digest
 */
abstract class Digest {
    constructor() {
        if (this.constructor === Digest) {
            throw new Error('Abstract classes cannot be instantiated.');
        }
    }

    static digest = (
        request_json: TransactionJSONType,
        tx_type?: TransactionTypes | PseudoTransactionTypes,
    ): Promise<string> => {
        throw new Error('Method digest() must be implemented.');
    };
}

export default Digest;
