/* eslint-disable */

// Native modules
import { NativeModules } from 'react-native';
const { CryptoModule } = NativeModules;

global.Buffer = require('buffer').Buffer;
global.process = require('process');

global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';

/* Global crypto ==================================================================== */

if (!window.crypto) {
    // @ts-ignore
    window.crypto = {};
}

// set getRandomValues with native module for security porpose
// @ts-ignore
window.crypto.getRandomValues = function(byteArray: any[]) {
    const useBuffer = Buffer.from(CryptoModule.randomKeySync(byteArray.length), 'hex');
    for (let i = 0; i < byteArray.length; i++) {
        byteArray[i] = useBuffer[i];
    }
    return byteArray;
};
