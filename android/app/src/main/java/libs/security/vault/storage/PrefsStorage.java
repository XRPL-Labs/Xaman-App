/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.HashSet;
import java.util.Set;

import libs.security.vault.storage.Keychain.KnownCiphers;
import libs.security.vault.storage.cipherStorage.CipherStorage;
import libs.security.vault.storage.cipherStorage.CipherStorage.EncryptionResult;

public class PrefsStorage {
    public static final String KEYCHAIN_DATA = "RN_KEYCHAIN";

    static public class ResultSet extends CipherStorage.CipherResult<byte[]> {
        @KnownCiphers
        public final String cipherStorageName;

        public ResultSet(@KnownCiphers final String cipherStorageName, final byte[] usernameBytes, final byte[] passwordBytes) {
            super(usernameBytes, passwordBytes);

            this.cipherStorageName = cipherStorageName;
        }
    }

    @NonNull
    private final SharedPreferences prefs;

    public PrefsStorage(@NonNull final ReactApplicationContext reactContext) {
        this.prefs = reactContext.getSharedPreferences(KEYCHAIN_DATA, Context.MODE_PRIVATE);
    }

    @Nullable
    public ResultSet getEncryptedEntry(@NonNull final String service) {
        byte[] bytesForUsername = getBytesForUsername(service);
        byte[] bytesForPassword = getBytesForPassword(service);
        String cipherStorageName = getCipherStorageName(service);

        // in case of wrong password or username
        if (bytesForUsername == null || bytesForPassword == null) {
            return null;
        }

        if (cipherStorageName == null) {
            return null;
        }

        return new ResultSet(cipherStorageName, bytesForUsername, bytesForPassword);

    }

    public void removeEntry(@NonNull final String service) {
        final String keyForUsername = getKeyForUsername(service);
        final String keyForPassword = getKeyForPassword(service);
        final String keyForCipherStorage = getKeyForCipherStorage(service);

        prefs.edit()
                .remove(keyForUsername)
                .remove(keyForPassword)
                .remove(keyForCipherStorage)
                .apply();
    }

    public void storeEncryptedEntry(@NonNull final String service, @NonNull final EncryptionResult encryptionResult) {
        final String keyForUsername = getKeyForUsername(service);
        final String keyForPassword = getKeyForPassword(service);
        final String keyForCipherStorage = getKeyForCipherStorage(service);

        prefs.edit()
                .putString(keyForUsername, Base64.encodeToString(encryptionResult.username, Base64.DEFAULT))
                .putString(keyForPassword, Base64.encodeToString(encryptionResult.password, Base64.DEFAULT))
                .putString(keyForCipherStorage, encryptionResult.cipherName)
                .apply();
    }


    public Set<String> getAllEntries() {
        Set<String> result = new HashSet<>();
        Set<String> keys = prefs.getAll().keySet();
        for (String key : keys) {
            if (isKeyForUsername(key)) {
                String alias = getAliasForUsername(key);
                result.add(alias);
            }
        }

        return result;
    }

    @Nullable
    private byte[] getBytesForUsername(@NonNull final String service) {
        final String key = getKeyForUsername(service);

        return getBytes(key);
    }

    @Nullable
    private byte[] getBytesForPassword(@NonNull final String service) {
        String key = getKeyForPassword(service);
        return getBytes(key);
    }

    @Nullable
    private String getCipherStorageName(@NonNull final String service) {
        String key = getKeyForCipherStorage(service);

        return this.prefs.getString(key, null);
    }

    @NonNull
    public static String getKeyForUsername(@NonNull final String service) {
        return service + ":" + "u";
    }

    @NonNull
    public static String getKeyForPassword(@NonNull final String service) {
        return service + ":" + "p";
    }

    @NonNull
    public static String getKeyForCipherStorage(@NonNull final String service) {
        return service + ":" + "c";
    }

    public static boolean isKeyForUsername(@NonNull final String key) {
        return key.endsWith(":u");
    }

    public static String getAliasForUsername(@NonNull final String key) {
        if (!key.endsWith(":u")) {
            return null;
        }

        return key.replace(":u", "");
    }

    @Nullable
    private byte[] getBytes(@NonNull final String key) {
        String value = this.prefs.getString(key, null);

        if (value != null) {
            return Base64.decode(value, Base64.DEFAULT);
        }

        return null;
    }
}
