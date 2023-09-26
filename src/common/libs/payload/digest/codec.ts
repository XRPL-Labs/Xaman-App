/**
 * @deprecated This digest algo is deprecated and should not be used in new code.
 */

import { mapKeys } from 'lodash';
import * as codec from 'ripple-binary-codec';

import { GetDeviceUniqueId } from '@common/helpers/device';
import { SHA1 } from '@common/libs/crypto';
import { PseudoTransactionTypes, TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

import Digest from './digest';
/* Class  ==================================================================== */
class DigestCodecWithSHA1 extends Digest {
    /**
     * The name of the hashing algorithm used by this codec.
     * @deprecated This constant is for historical purposes and should not be used in new code.
     */
    public static DIGEST_HASH_ALGO = 'DigestCodecWithSHA1';

    /**
     * Calculate the digest using SHA-1 algorithm and binary codec.
     *
     * @param {TransactionJSONType} request_json - Transaction JSON data to be hashed.
     * @param {TransactionTypes | PseudoTransactionTypes} tx_type - The type of transaction.
     * @returns {Promise<string>} A promise that resolves with the SHA-1 hash and codec.
     * @deprecated SHA-1 is a deprecated and insecure hashing algorithm. Use a more secure hashing method.
     */
    static digest = (
        request_json: TransactionJSONType,
        tx_type: TransactionTypes | PseudoTransactionTypes,
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            let hashEncodingMethod = 'encode';
            let normalizedRequestJson = request_json;

            // if it's the pseudo PaymentChannelAuthorize we need
            // 1) use encodeForSigningClaim method for encoding
            // 2) lower case the keys
            if (tx_type === PseudoTransactionTypes.PaymentChannelAuthorize) {
                hashEncodingMethod = 'encodeForSigningClaim';
                normalizedRequestJson = mapKeys(request_json, (v, k) => k.toLowerCase());
            }

            // calculate checksum
            // @ts-ignore
            const checksum = codec[hashEncodingMethod](normalizedRequestJson);

            // calculate digest SHA1{checksum}+{deviceId}
            const deviceId = GetDeviceUniqueId();
            // get the SHA1 of combined strings
            SHA1(`${checksum}+${deviceId}`).then(resolve).catch(reject);
        });
    };
}

/* Export  ==================================================================== */
export default DigestCodecWithSHA1;
