/* eslint-disable @typescript-eslint/no-unused-vars */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

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
        request_json: TransactionJson,
        tx_type?: TransactionTypes | PseudoTransactionTypes,
    ): Promise<string> => {
        throw new Error('Method digest() must be implemented.');
    };
}

export default Digest;
