/**
 * Preferences
 *
 * Save/Get user not important data in the shared preferences
 *
 */
import { NativeModules } from 'react-native';

/* Const ==================================================================== */
const { SharedPreferencesModule } = NativeModules;

enum Keys {
    DISPLAYED_MEMO_ALERT = 'DISPLAYED_MEMO_ALERT',
    LATEST_VERSION_CODE = 'LATEST_VERSION_CODE',
    UPDATE_IGNORE_VERSION_CODE = 'UPDATE_IGNORE_VERSION_CODE',
    XAPP_STORE_IGNORE_MESSAGE_ID = 'XAPP_STORE_IGNORE_MESSAGE_ID',
    EXPERIMENTAL_SIMPLICITY_UI = 'EXPERIMENTAL_SIMPLICITY_UI',
}

/* Lib ==================================================================== */
const Preferences = {
    keys: Keys,

    /**
     * Get shared preferences by key
     */
    get: async (key: Keys): Promise<string> => {
        return SharedPreferencesModule.get(key);
    },

    /**
     *  Store shared preferences
     */
    set: async (key: string, value: string): Promise<any> => {
        return SharedPreferencesModule.set(key, value);
    },

    /**
     *  Delete shared preferences
     */
    del: async (key: Keys): Promise<boolean> => {
        return SharedPreferencesModule.del(key);
    },
};

export default Preferences;
