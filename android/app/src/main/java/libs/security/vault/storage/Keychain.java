package libs.security.vault.storage;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.StringDef;

import com.facebook.react.bridge.ReactApplicationContext;

import libs.security.vault.storage.PrefsStorage.ResultSet;
import libs.security.vault.storage.cipherStorage.CipherStorage;
import libs.security.vault.storage.cipherStorage.CipherStorage.DecryptionResult;
import libs.security.vault.storage.cipherStorage.CipherStorage.EncryptionResult;
import libs.security.vault.storage.cipherStorage.CipherStorageKeystoreAesCbc;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.exceptions.KeyStoreAccessException;
import libs.security.vault.storage.cipherStorage.CipherStorageKeystoreAesGcm;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

public class Keychain {
    /**
     * Options mapping keys.
     */
    @interface Maps {
        String USERNAME = "username";
        String PASSWORD = "password";
    }

    /**
     * Supported ciphers.
     */
    @StringDef({KnownCiphers.AESCBC, KnownCiphers.AESGCM})
    public @interface KnownCiphers {
        /**
         * AES encryption.
         */

        // CBC
        String AESCBC = "KeystoreAESCBC";
        // GCM
        String AESGCM = "KeystoreAESGCM";
    }

    /**
     * Name-to-instance lookup  map.
     */
    private final Map<String, CipherStorage> cipherStorageMap = new HashMap<>();
    /**
     * Shared preferences storage.
     */
    private final PrefsStorage prefsStorage;
    //endregion

    //region Initialization

    /**
     * Default constructor.
     */
    public Keychain(@NonNull final ReactApplicationContext reactContext) {
        // create prefs storage
        prefsStorage = new PrefsStorage(reactContext);

        // add supported cipher storage
        addCipherStorageToMap(new CipherStorageKeystoreAesCbc());
        addCipherStorageToMap(new CipherStorageKeystoreAesGcm());
    }

    public void setItem(@NonNull final String alias,
                        @NonNull final String username,
                        @NonNull final String password) throws CryptoFailedException {

        // get latest cipher storage
        final CipherStorage storage = getCipherStorageForEncryption();

        // encrypt with cipher storage
        final EncryptionResult result = storage.encrypt(alias, username, password);

        // set in prefs storage
        prefsStorage.storeEncryptedEntry(alias, result);
    }

    public Map<String, String> getItem(@NonNull final String alias) throws CryptoFailedException {
        final ResultSet resultSet = prefsStorage.getEncryptedEntry(alias);

        // no entry found for given name
        if (resultSet == null) {
            return null;
        }

        final String storageName = resultSet.cipherStorageName;

        CipherStorage cipher = getCipherStorageByName(storageName);

        final DecryptionResult decryptionResult = decryptToResult(alias, cipher, resultSet);

        Map<String, String> item = new HashMap<>();

        item.put(Maps.USERNAME, decryptionResult.username);
        item.put(Maps.PASSWORD, decryptionResult.password);

        return item;
    }

    public void deleteItem(@NonNull final String alias) throws KeyStoreAccessException {
        // First we clean up the cipher storage (using the cipher storage that was used to store the entry)
        final ResultSet resultSet = prefsStorage.getEncryptedEntry(alias);

        if (resultSet != null) {
            final CipherStorage cipherStorage = getCipherStorageByName(resultSet.cipherStorageName);
            cipherStorage.removeKey(alias);
        }

        // And then we remove the entry in the shared preferences
        prefsStorage.removeEntry(alias);
    }

    public boolean itemExist(@NonNull final String alias) {
        final ResultSet resultSet = prefsStorage.getEncryptedEntry(alias);
        return resultSet != null;
    }

    /*
      Note: this will clear the entire keychain storage, including the generated keys
     */
    public void clear() throws KeyStoreAccessException {
        final Set<String> entries = prefsStorage.getAllEntries();

        for (String entry : entries) {
            Log.d("Keychain", entry);
            deleteItem(entry);
        }
    }

    private void addCipherStorageToMap(@NonNull final CipherStorage cipherStorage) {
        cipherStorageMap.put(cipherStorage.getCipherStorageName(), cipherStorage);
    }

    /**
     * Try to decrypt with provided storage.
     */
    @NonNull
    private DecryptionResult decryptToResult(@NonNull final String alias,
                                             @NonNull final CipherStorage storage,
                                             @NonNull final ResultSet resultSet)
            throws CryptoFailedException {
        return storage.decrypt(alias, resultSet.username, resultSet.password);
    }

    /**
     * use the most strong cipher storage encryption
     */
    @NonNull
    CipherStorage getCipherStorageForEncryption() {
        return getCipherStorageByName(KnownCiphers.AESGCM);
    }

    /**
     * Extract cipher by it unique name. {@link CipherStorage#getCipherStorageName()}.
     */
    @NonNull
    CipherStorage getCipherStorageByName(@KnownCiphers @NonNull final String knownName) {
        return Objects.requireNonNull(cipherStorageMap.get(knownName));
    }
}
