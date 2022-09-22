package libs.security.vault.cipher;

import android.util.Base64;

import androidx.annotation.NonNull;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import libs.security.crypto.Crypto;
import libs.security.vault.exceptions.CryptoFailedException;

public class CipherV1AesCbc {
    public static final int CIPHER_VERSION = 1;

    public static int getCipherVersion() {
        return CIPHER_VERSION;
    }

    /**
     * @deprecated THIS METHOD SHOULD NOT BE USED AS WE MOVED TO NEW ENCRYPTION ALGO
     */
    @NonNull
    @Deprecated
    public static Map<String, Object> encrypt(@NonNull final String input, @NonNull final String key) {
        throw new UnsupportedOperationException();
    }

    @NonNull
    public static String decrypt(@NonNull final String cipher, @NonNull final String key, @NonNull final Cipher.DerivedKeys derivedKeys) throws CryptoFailedException {
        try {
            // sha256 encryption key
            byte[] hashedKey = Crypto.SHA256Hash(key.getBytes(StandardCharsets.UTF_8));
            // cipher data is base64 encoded while encrypting in v1 encryption
            byte[] cipherBytes = Base64.decode(cipher, Base64.NO_WRAP);
            // convert hex iv string to hex data
            byte[] ivBytes = Crypto.HexToBytes(derivedKeys.iv);

            final byte[] decryptedBytes = Crypto.AESDecrypt(
                    Crypto.AESAlgo.CBC,
                    cipherBytes,
                    hashedKey,
                    ivBytes,
                    null
            );

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new CryptoFailedException("CipherV2AesGcm encryption error", e);
        }
    }
}
