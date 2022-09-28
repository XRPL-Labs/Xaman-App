/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage.cipherStorage;

import android.annotation.SuppressLint;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import libs.security.vault.storage.Keychain;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.exceptions.KeyStoreAccessException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.concurrent.atomic.AtomicInteger;

import javax.crypto.NoSuchPaddingException;

@RequiresApi(api = Build.VERSION_CODES.M)
public class CipherStorageKeystoreRsaEcb extends CipherStorageBase {
    //region Constants
    /**
     * Selected algorithm.
     */
    public static final String ALGORITHM_RSA = KeyProperties.KEY_ALGORITHM_RSA;
    /**
     * Selected block mode.
     */
    public static final String BLOCK_MODE_ECB = KeyProperties.BLOCK_MODE_ECB;
    /**
     * Selected padding transformation.
     */
    public static final String PADDING_PKCS1 = KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1;
    /**
     * Composed transformation algorithms.
     */
    public static final String TRANSFORMATION_RSA_ECB_PKCS1 =
            ALGORITHM_RSA + "/" + BLOCK_MODE_ECB + "/" + PADDING_PKCS1;
    /**
     * Selected encryption key size.
     */
    public static final int ENCRYPTION_KEY_SIZE = 3072;

    //endregion

    //region Overrides
    @Override
    @NonNull
    public EncryptionResult encrypt(@NonNull final String alias,
                                    @NonNull final String username,
                                    @NonNull final String password)
            throws CryptoFailedException {

        try {
            return innerEncryptedCredentials(alias, password, username);

            // KeyStoreException | KeyStoreAccessException  | NoSuchAlgorithmException | InvalidKeySpecException |
            //    IOException | NoSuchPaddingException | InvalidKeyException e
        } catch (NoSuchAlgorithmException | InvalidKeySpecException | NoSuchPaddingException | InvalidKeyException e) {
            throw new CryptoFailedException("Could not encrypt data for service " + alias, e);
        } catch (KeyStoreException | KeyStoreAccessException e) {
            throw new CryptoFailedException("Could not access Keystore for service " + alias, e);
        } catch (IOException io) {
            throw new CryptoFailedException("I/O error: " + io.getMessage(), io);
        } catch (final Throwable ex) {
            throw new CryptoFailedException("Unknown error: " + ex.getMessage(), ex);
        }
    }

    @NonNull
    @Override
    public DecryptionResult decrypt(@NonNull String alias,
                                    @NonNull byte[] username,
                                    @NonNull byte[] password)
            throws CryptoFailedException {

        final AtomicInteger retries = new AtomicInteger(1);

        Key key;

        try {
            // key is always NOT NULL otherwise GeneralSecurityException raised
            key = extractGeneratedKey(alias, retries);

            return new DecryptionResult(
                    decryptBytes(key, username),
                    decryptBytes(key, password)
            );
        } catch (final Throwable fail) {
            throw new CryptoFailedException("Unknown error: " + fail.getMessage(), fail);
        }
    }

    /**
     * RSAECB.
     */
    @Override
    public String getCipherStorageName() {
        return Keychain.KnownCiphers.RSA;
    }

    /**
     * RSA.
     */
    @NonNull
    @Override
    protected String getEncryptionAlgorithm() {
        return ALGORITHM_RSA;
    }

    /**
     * RSA/ECB/PKCS1Padding
     */
    @NonNull
    @Override
    protected String getEncryptionTransformation() {
        return TRANSFORMATION_RSA_ECB_PKCS1;
    }
    //endregion

    //region Implementation

    /**
     * Clean code without try/catch's that encrypt username and password with a key specified by alias.
     */
    @NonNull
    private EncryptionResult innerEncryptedCredentials(@NonNull final String alias,
                                                       @NonNull final String password,
                                                       @NonNull final String username)
            throws GeneralSecurityException, IOException {

        final KeyStore store = getKeyStoreAndLoad();

        // on first access create a key for storage
        if (!store.containsAlias(alias)) {
            generateKeyAndStoreUnderAlias(alias);
        }

        final KeyFactory kf = KeyFactory.getInstance(ALGORITHM_RSA);
        final Certificate certificate = store.getCertificate(alias);
        final PublicKey publicKey = certificate.getPublicKey();
        final X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKey.getEncoded());
        final PublicKey key = kf.generatePublic(keySpec);

        return new EncryptionResult(
                encryptString(key, username),
                encryptString(key, password),
                this);
    }

    /**
     * Get builder for encryption and decryption operations with required user Authentication.
     */
    @NonNull
    @Override
    @SuppressLint("NewApi")
    protected KeyGenParameterSpec.Builder getKeyGenSpecBuilder(@NonNull final String alias) {
        final int purposes = KeyProperties.PURPOSE_DECRYPT | KeyProperties.PURPOSE_ENCRYPT;

        return new KeyGenParameterSpec.Builder(alias, purposes)
                .setBlockModes(BLOCK_MODE_ECB)
                .setEncryptionPaddings(PADDING_PKCS1)
                .setRandomizedEncryptionRequired(true)
                .setKeySize(ENCRYPTION_KEY_SIZE);
    }

    /**
     * Try to generate key from provided specification.
     */
    @NonNull
    @Override
    protected Key generateKey(@NonNull final KeyGenParameterSpec spec) throws GeneralSecurityException {
        final KeyPairGenerator generator = KeyPairGenerator.getInstance(getEncryptionAlgorithm(), KEYSTORE_TYPE);
        generator.initialize(spec);

        return generator.generateKeyPair().getPrivate();
    }

    //endregion
}
