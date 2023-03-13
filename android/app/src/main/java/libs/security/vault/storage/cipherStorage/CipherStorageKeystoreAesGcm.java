/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage.cipherStorage;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Log;

import androidx.annotation.NonNull;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.util.concurrent.atomic.AtomicInteger;

import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.spec.GCMParameterSpec;

import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

public class CipherStorageKeystoreAesGcm extends CipherStorageBase {
    //region Constants
    /**
     * AES
     */
    public static final String ALGORITHM_AES = KeyProperties.KEY_ALGORITHM_AES;
    /**
     * CBC
     */
    public static final String BLOCK_MODE_GCM = KeyProperties.BLOCK_MODE_GCM;
    /**
     * PKCS7
     */
    public static final String ENCRYPTION_PADDING_NONE = KeyProperties.ENCRYPTION_PADDING_NONE;
    /**
     * Transformation path.
     */
    public static final String ENCRYPTION_TRANSFORMATION =
            ALGORITHM_AES + "/" + BLOCK_MODE_GCM + "/" + ENCRYPTION_PADDING_NONE;
    /**
     * Key size.
     */
    public static final int ENCRYPTION_KEY_SIZE = 256;
    /**
     * IV size.
     */
    public static final int IV_SIZE = 12;
    /**
     * TAG size.
     */
    public static final int TAG_SIZE = 16 * Byte.SIZE;

    //endregion

    //region Configuration
    @Override
    public String getCipherStorageName() {
        return Keychain.KnownCiphers.AESGCM;
    }


    /**
     * AES.
     */
    @Override
    @NonNull
    protected String getEncryptionAlgorithm() {
        return ALGORITHM_AES;
    }

    /**
     * AES/CBC/PKCS7Padding
     */
    @NonNull
    @Override
    protected String getEncryptionTransformation() {
        return ENCRYPTION_TRANSFORMATION;
    }

    //endregion

    //region Overrides
    @Override
    @NonNull
    public EncryptionResult encrypt(@NonNull final String alias,
                                    @NonNull final String username,
                                    @NonNull final String password)
            throws CryptoFailedException {

        final AtomicInteger retries = new AtomicInteger(1);

        try {
            final Key key = extractGeneratedKey(alias, retries);

            return new EncryptionResult(
                    encryptString(key, username),
                    encryptString(key, password),
                    this);
        } catch (GeneralSecurityException e) {
            throw new CryptoFailedException("Could not encrypt data with alias: " + alias, e);
        } catch (Throwable fail) {
            throw new CryptoFailedException("Unknown error with alias: " + alias +
                    ", error: " + fail.getMessage(), fail);
        }
    }

    @Override
    @NonNull
    public DecryptionResult decrypt(@NonNull final String alias,
                                    @NonNull final byte[] username,
                                    @NonNull final byte[] password)
            throws CryptoFailedException {
        final AtomicInteger retries = new AtomicInteger(1);

        try {
            final Key key = extractGeneratedKey(alias, retries);

            return new DecryptionResult(decryptBytes(key, username), decryptBytes(key, password));
        } catch (GeneralSecurityException e) {
            throw new CryptoFailedException("Could not decrypt data with alias: " + alias, e);
        } catch (Throwable fail) {
            throw new CryptoFailedException("Unknown error with alias: " + alias +
                    ", error: " + fail.getMessage(), fail);
        }
    }
    //endregion

    //region Implementation

    /**
     * Get encryption algorithm specification builder instance.
     */
    @NonNull
    @Override
    protected KeyGenParameterSpec.Builder getKeyGenSpecBuilder(@NonNull final String alias) {
        final int purposes = KeyProperties.PURPOSE_DECRYPT | KeyProperties.PURPOSE_ENCRYPT;

        return new KeyGenParameterSpec.Builder(alias, purposes)
                .setBlockModes(BLOCK_MODE_GCM)
                .setEncryptionPaddings(ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .setKeySize(ENCRYPTION_KEY_SIZE);
    }

    @NonNull
    public byte[] encryptString(@NonNull final Key key, @NonNull final String value)
            throws GeneralSecurityException, IOException {

        final Cipher cipher = getCachedInstance();

        // encrypt the value using a CipherOutputStream
        try (final ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            cipher.init(Cipher.ENCRYPT_MODE, key);

            // add iv to the output
            final byte[] iv = cipher.getIV();
            output.write(iv, 0, iv.length);

            try (final CipherOutputStream encrypt = new CipherOutputStream(output, cipher)) {
                encrypt.write(value.getBytes(UTF8));
            }

            return output.toByteArray();
        } catch (Throwable fail) {
            Log.e(LOG_TAG, fail.getMessage(), fail);
            throw fail;
        }
    }

    /**
     * Decrypt provided bytes to a string.
     */
    @NonNull
    protected String decryptBytes(@NonNull final Key key, @NonNull final byte[] bytes)
            throws GeneralSecurityException {
        final Cipher cipher = getCachedInstance();

        try {
            // read the initialization vector from bytes array
            final GCMParameterSpec gcmSpecs = new GCMParameterSpec(TAG_SIZE, bytes, 0, IV_SIZE);
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpecs);

            // decrypt the bytes using cipher.doFinal(). Using a CipherInputStream for decryption has historically led to issues
            // on the Pixel family of devices.
            // see https://github.com/oblador/react-native-keychain/issues/383
            byte[] decryptedBytes = cipher.doFinal(bytes, IV_SIZE, bytes.length - IV_SIZE);
            return new String(decryptedBytes, UTF8);
        } catch (Throwable fail) {
            Log.w(LOG_TAG, fail.getMessage(), fail);
            throw fail;
        }
    }
    //endregion
}
