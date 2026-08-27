package libs.security.vault;

/**
 * Native vault failure codes returned to JS via Promise.reject(code, message).
 * Do not include passphrase, seed, or wrap-key material in messages.
 */
public final class VaultErrorCodes {
    public static final String WRONG_PASSPHRASE = "WRONG_PASSPHRASE";
    public static final String KEYSTORE_UNRECOVERABLE = "KEYSTORE_UNRECOVERABLE";
    public static final String KEYSTORE_DECRYPT = "KEYSTORE_DECRYPT";
    public static final String UNIQUE_ID_MISSING = "UNIQUE_ID_MISSING";
    public static final String DEVICE_ID_CHANGED = "DEVICE_ID_CHANGED";
    public static final String VAULT_CORRUPT = "VAULT_CORRUPT";

    private VaultErrorCodes() {
    }
}
