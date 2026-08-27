package libs.security.vault;

import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import libs.security.crypto.Crypto;
import libs.security.providers.UniqueIdProvider;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

@ReactModule(name = libs.security.vault.VaultManagerModule.NAME)
public class VaultManagerModule extends ReactContextBaseJavaModule {
    public static final String RECOVERY_SUFFIX = "_RECOVER";
    public static final String STORAGE_ENCRYPTION_KEY = "xumm-realm-key";

    static final String NAME = "VaultManagerModule";
    private final Keychain keychain;

    public VaultManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);

        // initiate keychain
        keychain = new Keychain(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }


    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("latestCipherVersion", Cipher.getLatestCipherVersion());
        return constants;
    }

    private static void rejectWithError(Promise promise, Exception exception) {
        String code = "-1";
        if (exception instanceof CryptoFailedException) {
            code = ((CryptoFailedException) exception).getCode();
        }
        StringBuilder error = new StringBuilder();
        error.append(exception.getMessage());
        if (exception.getCause() != null) {
            error.append(": ");
            error.append(exception.getCause().toString());
        }
        // Extra Security cipher only. Realm/Keystore wrap is not bound to ANDROID_ID.
        if (shouldMarkDeviceIdChanged(code)) {
            error.append("; last stored device id does not match current device id");
            error.append(" (possible data migration to another device); underlying=");
            error.append(code);
            code = VaultErrorCodes.DEVICE_ID_CHANGED;
        }
        promise.reject(code, error.toString());
    }

    /**
     * DEVICE_ID_CHANGED is a support overlay for Extra Security decrypt (WRONG_PASSPHRASE)
     * when last-known ANDROID_ID differs from live. Do not overlay Keystore wrap failures.
     */
    static boolean shouldMarkDeviceIdChanged(@NonNull final String code) {
        return VaultErrorCodes.WRONG_PASSPHRASE.equals(code)
                && UniqueIdProvider.sharedInstance().isLastKnownDeviceIdChanged();
    }

    private static String getRecoveryVaultName(@NonNull final String vaultName) {
        return String.format("%s%s", vaultName, RECOVERY_SUFFIX);
    }


    //region VaultManager

    /*
        Create a new encrypted vault with given name/data and encrypt with provided key
        NOTE: existing vault cannot be overwritten
    */
    public synchronized boolean createVault(final String vaultName, final String data, final String key)
            throws Exception {

        // check if the vault already exist, we don't want to overwrite the existing vault
        // get the item from storage
        boolean exist = keychain.itemExist(vaultName);

        // vault already exist, just reject
        // ^^ update: just overwrite?...
        if (exist) {
            // throw new Exception("VAULT_ALREADY_EXIST");
        }

        // try to encrypt the data with provided key
        Map<String, Object> cipherResult = Cipher.encrypt(data, key);

        // convert dict derived keys to string
        Cipher.DerivedKeys derivedKeys = (Cipher.DerivedKeys) cipherResult.get("derived_keys");
        String derivedKeyString = derivedKeys.toJSONString();

        String cipher = (String) cipherResult.get("cipher");

        if (cipher == null) {
            throw new Exception("UNABLE_TO_GET_VAULT_CIPHER");
        }

        // store vault in the keychain
        keychain.setItem(vaultName, derivedKeyString, cipher);

        // try to open the vault once before passing the result
        // with this we make sure we are able to access the data
        final String clearText = openVault(vaultName, key, false);

        // check if open vault result is equal to stored data
        if (!clearText.equals(data)) {
            throw new Exception("UNABLE_TO_VERIFY_RESULT");
        }

        return true;
    }


    /*
     Open the encrypted vault with provided key and return the clear data
    */
    public String openVault(@NonNull final String vaultName, @NonNull final String key, final boolean recoverable)
            throws Exception {
        // an indicator that vault is recovered
        boolean isVaultRecovered = false;
        final String recoveryVaultName = VaultManagerModule.getRecoveryVaultName(vaultName);

        // try to get vault with provided  name
        Map<String, String> item = keychain.getItem(vaultName);

        // if no item found an recoverable, check if recovery vault available
        if (item == null && recoverable) {
            // try to fetch recovery vault
            item = keychain.getItem(recoveryVaultName);
            // we were able to fetch from recovery vault
            if (item != null) {
                isVaultRecovered = true;
            }
        }

        // no item found in the storage for the given name, reject
        if (item == null || item.get("password") == null || item.get("username") == null) {
            throw new Exception("VAULT_NOT_EXIST");
        }

        // decrypt the Keychain data
        final String clearText = Cipher.decrypt(
                Objects.requireNonNull(item.get("password")),
                key,
                Objects.requireNonNull(item.get("username"))
        );

        // check if clear text is not empty
        if (TextUtils.isEmpty(clearText)) {
            throw new Exception("VAULT_DATA_IS_NULL");
        }

        // check if vault is recovered, then try to create the vault under the old name and remove recovery
        if (isVaultRecovered) {
            try {
                // create the vault under the given name
                createVault(vaultName, clearText, key);
                // purge recovery vault
                purgeVault(recoveryVaultName);
            } catch (Exception e) {
                // ignore in case of any exception
                throw new Exception("Failed to restore vault from recovery: " + e.getMessage());
            }
        }

        return clearText;
    }

    /*
    Re-key current vault with new key
    NOTE: in case of migration required this will create new vault with latest cipher
    */
    public boolean reKeyVault(@NonNull final String vaultName, @NonNull final String oldKey, @NonNull final String newKey)
            throws Exception {
        // try to open the vault with provided old key and get clear text
        final String clearText = openVault(vaultName, oldKey, false);

        // try to create the new vault under a temp recovery name with the old key
        // with this we will make sure we are able to recover the key in case of failure
        final String recoveryVaultName = VaultManagerModule.getRecoveryVaultName(vaultName);

        // check if a recovery vault is already exist, then remove it
        // NOTE: removing recovery vault is safe as we could open the main vault
        if(vaultExist(recoveryVaultName)){
            purgeVault(recoveryVaultName);
        }

        // create the recovery vault with the old key
        createVault(recoveryVaultName, clearText, oldKey);

        // after we made sure we can store the data in a safe way, purge old vault
        purgeVault(vaultName);

        // create the vault again with the new key
        createVault(vaultName, clearText, newKey);

        // finally remove the created recovery vault
        purgeVault(recoveryVaultName);

        return true;
    }

   /*
   Re-key batch vaults with new key
   NOTE: in case of migration required this will create new vault with latest cipher
   */
    public boolean reKeyBatchVaults(@NonNull final ArrayList<String> vaultNames, @NonNull final String oldKey, @NonNull final String newKey)
            throws Exception {

        Map<String, String> vaultsClearText = new HashMap<>();

        // try to open all vaults with provided old key and get clear text
        for (String vaultName: vaultNames){
            String clearText = openVault(vaultName, oldKey, false);
            vaultsClearText.put(vaultName, clearText);
        }

        // try to create the new vault under a temp recovery name with the old key for all vaults
        // with this we will make sure we are able to recover the key in case of failure
        for (String vaultName: vaultNames){
            // check if a recovery vault is already exist, then remove it
            // NOTE: removing recovery vault is safe as we could open the main vault
            if(vaultExist(VaultManagerModule.getRecoveryVaultName(vaultName))){
                purgeVault(VaultManagerModule.getRecoveryVaultName(vaultName));
            }
            createVault(
                    VaultManagerModule.getRecoveryVaultName(vaultName),
                    vaultsClearText.get(vaultName),
                    oldKey
            );
        }

        // remove old vault and create one
        for (String vaultName: vaultNames){
            // after we made sure we can store the data in a safe way, purge old vault
            purgeVault(vaultName);
            // create the vault again with the new key
            createVault(
                    vaultName,
                    vaultsClearText.get(vaultName),
                    newKey
            );
        }

        // finally remove the created recovery vaults
        for (String vaultName: vaultNames){
            purgeVault(VaultManagerModule.getRecoveryVaultName(vaultName));
        }

        return true;
    }


    /*
    Check vault is already exist with given name
    */
    public boolean vaultExist(@NonNull final String vaultName) {
        return keychain.itemExist(vaultName);
    }


    /*
     Purge a vault with given name
     NOTE: this action cannot be undo and is permanent
    */
    public boolean purgeVault(@NonNull final String vaultName) throws Exception {
        keychain.deleteItem(vaultName);
        return true;
    }

    /*
     Purge ALL vaults in the keychain
     NOTE: this action cannot be undo and is permanent, used with caution
    */
    public void clearStorage() {
        keychain.clear();
    }

    /**
     * User wipe after Keystore loss. Remove keychain blobs (commit), last-known
     * ANDROID_ID, and Realm files. JS Realm.deleteFile is not enough: the
     * unreadable xumm-realm-key wrap keeps the next launch in the wipe dialog.
     */
    public void wipeLocalDatastore() {
        clearStorage();
        UniqueIdProvider.sharedInstance().init(getReactApplicationContext());
        UniqueIdProvider.sharedInstance().clearLastKnownAndroidId();
        File dir = getReactApplicationContext().getFilesDir();
        if (dir != null) {
            deleteQuietly(new File(dir, "xumm.realm"));
            deleteQuietly(new File(dir, "xumm.realm.lock"));
            deleteQuietly(new File(dir, "xumm.realm.note"));
            deleteQuietly(new File(dir, "xumm.realm.management"));
        }
    }

    private static void deleteQuietly(@NonNull final File file) {
        if (!file.exists()) {
            return;
        }
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteQuietly(child);
                }
            }
        }
        //noinspection ResultOfMethodCallIgnored
        file.delete();
    }

    /*
    Check a vault is encrypted with the latest Cipher or it needs a migrations
    */
    public WritableMap isMigrationRequired(@NonNull final String vaultName) throws Exception {
        // get the item from storage
        Map<String, String> item = keychain.getItem(vaultName);

        // calculate derived keys for this vault
        Cipher.DerivedKeys derivedKeys = Cipher.getDerivedKeys(
                Objects.requireNonNull(item.get("username"))
        );

        int latestCipherVersion = Cipher.getLatestCipherVersion();
        int currentCipherVersion = derivedKeys.version;

        boolean isMigrationRequired = latestCipherVersion > currentCipherVersion;

        final WritableMap results = Arguments.createMap();
        results.putString("vault", vaultName);
        results.putInt("current_cipher_version", currentCipherVersion);
        results.putInt("latest_cipher_version", latestCipherVersion);
        results.putBoolean("migration_required", isMigrationRequired);

        return results;
    }


    /*
    Check if storage encryption key exist in the keychain
    */
    public boolean isStorageEncryptionKeyExist() {
        return keychain.itemExist(STORAGE_ENCRYPTION_KEY);
    }

    /*
    Get the storage encryption key from keychain
    NOTE: this method will generate new key and store it in case of missing key
    */
    public String getStorageEncryptionKey() throws Exception {
        // try to retrieve the key
        Map<String, String> item = keychain.getItem(STORAGE_ENCRYPTION_KEY);

        // key already exist in the keychain
        if (item != null) {
            return Objects.requireNonNull(item.get("password"));
        }

        // key not exist
        // if no key found in the keychain try to generate one and store in the keychain
        byte[] encryptionKeyBytes = Crypto.RandomBytes(64);

        // convert encryption key to hex
        String encryptionKey = Crypto.BytesToHex(encryptionKeyBytes);

        // store new encryption key in the keychain
        keychain.setItem(STORAGE_ENCRYPTION_KEY, "", encryptionKey);

        // return new encryption key
        return encryptionKey;
    }


    //endregion


    //region JS interface

    @ReactMethod
    public void createVault(String vaultName, String data, String key, Promise promise) {
        try {
            boolean result = createVault(vaultName, data, key);
            promise.resolve(result);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void openVault(String vaultName, String key, Promise promise) {
        try {
            String clearText = openVault(vaultName, key, true);
            UniqueIdProvider.DeviceIdUnlockReport report =
                    UniqueIdProvider.sharedInstance().consumeLastUnlockReport();
            WritableMap result = Arguments.createMap();
            result.putString("clearText", clearText);
            result.putBoolean("fallbackUsed", report != null && report.fallbackUsed);
            result.putBoolean("storedDifferedFromLive", report != null && report.storedDifferedFromLive);
            promise.resolve(result);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void reKeyVault(String vaultName, String oldKey, String newKey, Promise promise) {
        try {
            boolean result = reKeyVault(vaultName, oldKey, newKey);
            promise.resolve(result);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void reKeyBatchVaults(ReadableArray vaultNames, String oldKey, String newKey, Promise promise) {
        try {
            ArrayList<String> vaultsNamesList = (ArrayList<String>)(ArrayList<?>)(vaultNames.toArrayList());
            boolean result = reKeyBatchVaults(vaultsNamesList, oldKey, newKey);
            promise.resolve(result);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void vaultExist(String vaultName, Promise promise) {
        try {
            boolean exist = vaultExist(vaultName);
            promise.resolve(exist);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void purgeVault(String vaultName, Promise promise) {
        try {
            purgeVault(vaultName);
            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void clearStorage(Promise promise) {
        try {
            clearStorage();
            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void wipeLocalDatastore(Promise promise) {
        try {
            wipeLocalDatastore();
            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void isMigrationRequired(String vaultName, Promise promise) {
        try {
            final WritableMap results = isMigrationRequired(vaultName);
            promise.resolve(results);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void isStorageEncryptionKeyExist(Promise promise) {
        try {
            Boolean result = isStorageEncryptionKeyExist();
            promise.resolve(result);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void getStorageEncryptionKey(Promise promise) {
        try {
            String encryptionKey = getStorageEncryptionKey();
            promise.resolve(encryptionKey);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    /**
     * Probe Realm wrap and device-id cache. Does not unwrap account vaults.
     * Does not need the passphrase. Does not return device id values.
     */
    public WritableMap buildVaultHealthReport() {
        UniqueIdProvider uniqueIdProvider = UniqueIdProvider.sharedInstance();
        UniqueIdProvider.BindingHealth binding = uniqueIdProvider.inspectBinding();
        WritableMap map = Arguments.createMap();
        map.putBoolean("lastKnownPresent", binding.lastKnownPresent);
        map.putBoolean("livePresent", binding.livePresent);
        map.putBoolean("lastKnownMatchesLive", binding.lastKnownMatchesLive);
        map.putBoolean("uniqueIdKeychainReadable", binding.uniqueIdKeychainReadable);
        map.putBoolean("realmKeyReadable", canUnwrapAlias(STORAGE_ENCRYPTION_KEY));

        int vaultsPresent = 0;
        Set<String> aliases = keychain.getAllAliases();
        for (String alias : aliases) {
            if (STORAGE_ENCRYPTION_KEY.equals(alias)
                    || UniqueIdProvider.UNIQUE_DEVICE_ID_KEY.equals(alias)
                    || alias.endsWith(RECOVERY_SUFFIX)) {
                continue;
            }
            if (keychain.itemExist(alias)) {
                vaultsPresent++;
            }
        }
        map.putInt("vaultsPresent", vaultsPresent);
        return map;
    }

    @ReactMethod
    public void inspectVaultHealth(Promise promise) {
        try {
            promise.resolve(buildVaultHealthReport());
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    private boolean canUnwrapAlias(@NonNull final String alias) {
        try {
            if (!keychain.itemExist(alias)) {
                return false;
            }
            return keychain.getItem(alias) != null;
        } catch (Exception e) {
            return false;
        }
    }

    //endregion
}
