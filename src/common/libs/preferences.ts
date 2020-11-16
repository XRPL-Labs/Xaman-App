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
    del: async (key: Keys): Promise<string> => {
        return SharedPreferencesModule.del(key);
    },
};

export default Preferences;
