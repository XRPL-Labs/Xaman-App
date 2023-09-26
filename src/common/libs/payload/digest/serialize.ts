/**
 * Digesting and serializing transaction json using the SHA-1 hashing algorithm.
 */

import { GetDeviceUniqueId } from '@common/helpers/device';
import { SHA1 } from '@common/libs/crypto';
import { TransactionJSONType } from '@common/libs/ledger/types';

import Digest from './digest';

/* Class  ==================================================================== */
class DigestSerializeWithSHA1 extends Digest {
    /**
     * The name of the hashing algorithm used by this codec.
     */
    public static DIGEST_HASH_ALGO = 'DigestSerializeWithSHA1';

    /**
     * Serialize an object into a string representation.
     *
     * @param {*} obj - The object to be serialized.
     * @returns {string} The serialized string representation of the object.
     * @throws {Error} Throws an error if the input object type is not supported.
     */
    static serialize = (obj: any): string => {
        if (Array.isArray(obj)) {
            return `[${obj.map((el) => DigestSerializeWithSHA1.serialize(el)).join(',')}]`;
        }
        if (typeof obj === 'object' && obj !== null) {
            let out = '';
            const keys = Object.keys(obj).sort();
            out += `{${JSON.stringify(keys)}`;
            for (let i = 0; i < keys.length; i++) {
                out += `${DigestSerializeWithSHA1.serialize(obj[keys[i]])},`;
            }
            return `${out}}`;
        }
        if (['string', 'number', 'boolean'].includes(typeof obj)) {
            return `${JSON.stringify(obj)}`;
        }

        throw new Error(`Invalid object type ${typeof obj}`);
    };

    /**
     * Calculate the digest of a serialized object using the SHA-1 algorithm.
     *
     * @param {TransactionJSONType} request_json - The JSON data to be serialized and hashed.
     * @returns {Promise<string>} A promise that resolves with the SHA-1 hash.
     * @throws {Error} Throws an error if the input data is not a valid object.
     */
    static digest = (request_json: TransactionJSONType): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (typeof request_json !== 'object' || !request_json) {
                reject(new Error('digest `request_json` should be valid object!'));
                return;
            }

            const serialized = DigestSerializeWithSHA1.serialize(request_json);
            // calculate checksum
            SHA1(`${serialized}`)
                .then((checksum) => {
                    // calculate digest SHA1{checksum}+{deviceId}
                    const deviceId = GetDeviceUniqueId();
                    return SHA1(`${checksum}+${deviceId}`).then(resolve).catch(reject);
                })
                .catch(reject);
        });
    };
}

/* Export  ==================================================================== */
export default DigestSerializeWithSHA1;
