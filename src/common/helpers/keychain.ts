import * as KeychainLib from 'react-native-keychain';
import { randomKey } from '@common/libs/crypto';

import { HexEncoding } from '@common/libs/utils';

const Keychain = {
    getStorageEncryptionKey: async (keyName: string): Promise<Buffer> => {
        return KeychainLib.getInternetCredentials(keyName).then((data: any) => {
            if (!data) {
                return randomKey(64).then((key: string) => {
                    return KeychainLib.setInternetCredentials(keyName, 'empty', key).then(() => {
                        return HexEncoding.toBinary(key);
                    });
                });
            }
            return HexEncoding.toBinary(data.password);
        });
    },
};

export { Keychain };
