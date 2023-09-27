import Locale from '../src/locale';

import NetworkService from '../src/services/NetworkService';
import { Amendments } from '../src/common/constants';

// set local
Locale.setLocale('EN');

// set connected network
// @ts-ignore
NetworkService.network = {
    baseReserve: 10,
    ownerReserve: 2,
    isFeatureEnabled(amendment: keyof typeof Amendments): boolean {
        return true;
    },
    definitions: {},
    nativeAsset: {
        asset: 'XRP',
        icon: '',
        iconSquare: '',
        set: function (element: { [key: string]: unknown }): Realm.DictionaryBase<unknown> {
            throw new Error('Function not implemented.');
        },
        remove: function (key: string | string[]): Realm.DictionaryBase<unknown> {
            throw new Error('Function not implemented.');
        },
        addListener: function (callback: Realm.DictionaryChangeCallback): void {
            throw new Error('Function not implemented.');
        },
        removeListener: function (callback: Realm.DictionaryChangeCallback): void {
            throw new Error('Function not implemented.');
        },
        removeAllListeners: function (): void {
            throw new Error('Function not implemented.');
        },
        toJSON: function (): Record<string, unknown> {
            throw new Error('Function not implemented.');
        },
    },
};
