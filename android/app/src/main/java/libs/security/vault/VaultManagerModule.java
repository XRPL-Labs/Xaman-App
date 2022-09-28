package libs.security.vault;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import java.util.Map;
import java.util.Objects;

import libs.security.crypto.Crypto;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.storage.Keychain;


@ReactModule(name = libs.security.vault.VaultManagerModule.NAME)
public class VaultManagerModule extends ReactContextBaseJavaModule {
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

    private static void rejectWithError(Promise promise, Exception exception){
        StringBuilder error =  new StringBuilder();
        error.append(exception.getMessage());
        if(exception.getCause() != null){
            error.append(": ");
            error.append(exception.getCause().toString());
        }
        promise.reject("-1", error.toString());
    }

    @ReactMethod
    public void createVault(String vaultName, String data, String key, Promise promise) {
        try {
            // check if the vault already exist, we don't want to overwrite the existing vault
            // get the item from storage
            boolean exist = keychain.itemExist(vaultName);

            // vault already exist, just reject
            if (exist) {
                promise.reject(
                        "VAULT_ALREADY_EXIST",
                        "Vault already exist, cannot overwrite current vault!"
                );
                return;
            }

            // try to encrypt the data with provided key
            Map<String, Object> cipherResult = Cipher.encrypt(data, key);

            // convert dict derived keys to string
            Cipher.DerivedKeys derivedKeys = (Cipher.DerivedKeys) cipherResult.get("derived_keys");
            String derivedKeyString = derivedKeys.toJSONString();

            String cipher = (String) cipherResult.get("cipher");

            // store vault in the keychain
            keychain.setItem(vaultName, derivedKeyString, cipher);

            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }


    @ReactMethod
    public void vaultExist(String vaultName, Promise promise) {
        try {
            boolean exist = keychain.itemExist(vaultName);
            promise.resolve(exist);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }


    @ReactMethod
    public void openVault(String vaultName, String key, Promise promise) {
        try {
            Map<String, String> item = keychain.getItem(vaultName);

            // no item found in the storage for the given name, just reject
            if (item == null) {
                promise.reject(
                        "VAULT_NOT_EXIST",
                        "Unable to find the vault in the storage!"
                );
                return;
            }

            String clearText = Cipher.decrypt(
                    Objects.requireNonNull(item.get("password")),
                    key,
                    Objects.requireNonNull(item.get("username"))
            );

            promise.resolve(clearText);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void purgeVault(String vaultName, Promise promise) {
        try {
            keychain.deleteItem(vaultName);
            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void purgeAll(Promise promise) {
        try {
            keychain.clear();
            promise.resolve(true);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }

    @ReactMethod
    public void isMigrationRequired(String vaultName, Promise promise) {
        try {
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

            promise.resolve(results);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }


    @ReactMethod
    public void getStorageEncryptionKey(String keyName, Promise promise) {
        try {
            // try to retrieve the key
            Map<String, String> item = keychain.getItem(keyName);

            // key already exist in the keychain
            if (item != null) {
                promise.resolve(Objects.requireNonNull(item.get("password")));
                return;
            }

            // key not exist
            // if no key found in the keychain try to generate one and store in the keychain
            byte[] encryptionKeyBytes = Crypto.RandomBytes(64);

            // convert encryption key to hex
            String encryptionKey = Crypto.BytesToHex(encryptionKeyBytes);

            // store new encryption key in the keychain
            keychain.setItem(keyName, "", encryptionKey);

            // return new encryption key
            promise.resolve(encryptionKey);
        } catch (Exception e) {
            rejectWithError(promise, e);
        }
    }
}
