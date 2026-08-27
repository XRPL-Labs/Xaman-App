/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage.cipherStorage;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.util.Log;

import androidx.annotation.NonNull;

import libs.security.vault.VaultErrorCodes;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.exceptions.KeyStoreAccessException;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.ProviderException;
import java.security.UnrecoverableKeyException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;

abstract public class CipherStorageBase implements CipherStorage {
  //region Constants
  /** Logging tag. */
  protected static final String LOG_TAG = CipherStorageBase.class.getSimpleName();
  /** Default key storage type/name. */
  public static final String KEYSTORE_TYPE = "AndroidKeyStore";
  /** Default charset encoding. */
  public static final Charset UTF8 = StandardCharsets.UTF_8;
  //endregion

  //region Members
  /** Guard for {@link #isStrongboxAvailable} field assignment. */
  protected final Object _syncStrongbox = new Object();
  /** Try to resolve support of the strongbox and cache result for future calls. */
  protected transient AtomicBoolean isStrongboxAvailable;
  /** Get cached instance of cipher. Get instance operation is slow. */
  protected transient Cipher cachedCipher;
  /** Cached instance of the Keystore. */
  protected transient KeyStore cachedKeyStore;


  /** Remove key with provided name from security storage. */
  @Override
  public void removeKey(@NonNull final String alias) throws KeyStoreAccessException {
    final KeyStore ks = getKeyStoreAndLoad();

    try {
      if (ks.containsAlias(alias)) {
        ks.deleteEntry(alias);
      }
    } catch (GeneralSecurityException ignored) {
      /* only one exception can be raised by code: 'KeyStore is not loaded' */
    }
  }


  @Override
  public Set<String> getAllKeys() throws KeyStoreAccessException {
    final KeyStore ks = getKeyStoreAndLoad();
    try {
      Enumeration<String> aliases = ks.aliases();
      return new HashSet<>(Collections.list(aliases));

    } catch (KeyStoreException e) {
      throw new KeyStoreAccessException("Error accessing aliases in keystore " + ks, e);
    }
  }

  //endregion

  //region Abstract methods

  /** Get encryption algorithm specification builder instance. */
  @NonNull
  protected abstract KeyGenParameterSpec.Builder getKeyGenSpecBuilder(@NonNull final String alias)
    throws GeneralSecurityException;

  /** Get name of the required encryption algorithm. */
  @NonNull
  protected abstract String getEncryptionAlgorithm();

  /** Get transformation algorithm for encrypt/decrypt operations. */
  @NonNull
  protected abstract String getEncryptionTransformation();
  //endregion

  //region Implementation

  /** Get cipher instance and cache it for any next call. */
  @NonNull
  public Cipher getCachedInstance() throws NoSuchAlgorithmException, NoSuchPaddingException {
    if (null == cachedCipher) {
      synchronized (this) {
        if (null == cachedCipher) {
          cachedCipher = Cipher.getInstance(getEncryptionTransformation());
        }
      }
    }

    return cachedCipher;
  }

  /**
   * Try to generate key from provided specification.
   */
  @NonNull
  protected Key generateKey(@NonNull final KeyGenParameterSpec spec) throws GeneralSecurityException {
    final KeyGenerator generator = KeyGenerator.getInstance(getEncryptionAlgorithm(), KEYSTORE_TYPE);

    // initialize key generator
    generator.init(spec);

    return generator.generateKey();
  }

  /** Extract existing key or generate a new one. Encrypt path only. Never delete on failure. */
  @NonNull
  protected Key extractGeneratedKey(@NonNull final String safeAlias)
    throws GeneralSecurityException {
    final KeyStore keyStore = getKeyStoreAndLoad();

    if (!keyStore.containsAlias(safeAlias)) {
      generateKeyAndStoreUnderAlias(safeAlias);
    }

    return extractKey(keyStore, safeAlias);
  }

  /**
   * Load an existing Keystore key for decrypt. Never delete the alias. Never mint a new key.
   * Samsung/One UI firmware can make StrongBox keys unrecoverable; deleting the alias bricks the vault.
   */
  @NonNull
  protected Key extractExistingKey(@NonNull final String safeAlias) throws GeneralSecurityException {
    final KeyStore keyStore = getKeyStoreAndLoad();

    try {
      if (!keyStore.containsAlias(safeAlias)) {
        throw new CryptoFailedException(
                VaultErrorCodes.KEYSTORE_UNRECOVERABLE,
                "Keystore alias missing: " + safeAlias,
                null
        );
      }
    } catch (CryptoFailedException e) {
      throw e;
    } catch (KeyStoreException e) {
      throw new CryptoFailedException(
              VaultErrorCodes.KEYSTORE_UNRECOVERABLE,
              "Keystore alias check failed: " + safeAlias,
              e
      );
    }

    try {
      final Key key = keyStore.getKey(safeAlias, null);
      if (key == null) {
        throw new CryptoFailedException(
                VaultErrorCodes.KEYSTORE_UNRECOVERABLE,
                "Empty key extracted for alias: " + safeAlias,
                null
        );
      }
      return key;
    } catch (CryptoFailedException e) {
      throw e;
    } catch (UnrecoverableKeyException | KeyStoreException | ProviderException e) {
      throw new CryptoFailedException(
              VaultErrorCodes.KEYSTORE_UNRECOVERABLE,
              "Keystore key unrecoverable for alias: " + safeAlias,
              e
      );
    }
  }

  @NonNull
  protected static String classifyDecryptFailure(@NonNull final Throwable fail) {
    Throwable current = fail;
    while (current != null) {
      if (current instanceof UnrecoverableKeyException
              || current instanceof KeyStoreException
              || current instanceof ProviderException) {
        return VaultErrorCodes.KEYSTORE_UNRECOVERABLE;
      }
      final String message = current.getMessage();
      if (message != null && message.toLowerCase(Locale.ROOT).contains("invalid key blob")) {
        return VaultErrorCodes.KEYSTORE_UNRECOVERABLE;
      }
      current = current.getCause();
    }
    return VaultErrorCodes.KEYSTORE_DECRYPT;
  }

  /** Load a Keystore key. Do not delete the alias if the key is unrecoverable. */
  @NonNull
  protected Key extractKey(@NonNull final KeyStore keyStore,
                           @NonNull final String safeAlias)
    throws GeneralSecurityException {
    final Key key = keyStore.getKey(safeAlias, null);

    if (null == key) {
      throw new KeyStoreAccessException("Empty key extracted!");
    }

    return key;
  }

  /** Load key store. */
  @NonNull
  public KeyStore getKeyStoreAndLoad() throws KeyStoreAccessException {
    if (null == cachedKeyStore) {
      synchronized (this) {
        if (null == cachedKeyStore) {
          // initialize instance
          try {
            final KeyStore keyStore = KeyStore.getInstance(KEYSTORE_TYPE);
            keyStore.load(null);

            cachedKeyStore = keyStore;
          } catch (final Throwable fail) {
            throw new KeyStoreAccessException("Could not access Keystore", fail);
          }
        }
      }
    }

    return cachedKeyStore;
  }

  /** Get the most secured keystore */
  public void generateKeyAndStoreUnderAlias(@NonNull final String alias)
    throws GeneralSecurityException {

    // Firstly, try to generate the key as safe as possible (strongbox).
    // see https://developer.android.com/training/articles/keystore#HardwareSecurityModule

    Key secretKey = null;

    // multi-threaded usage is possible
    synchronized (_syncStrongbox) {
      if (null == isStrongboxAvailable || isStrongboxAvailable.get()) {
        if (null == isStrongboxAvailable) isStrongboxAvailable = new AtomicBoolean(false);

        try {
          secretKey = tryGenerateStrongBoxSecurityKey(alias);

          isStrongboxAvailable.set(true);
        } catch (GeneralSecurityException | ProviderException ex) {
          Log.w(LOG_TAG, "StrongBox security storage is not available.");
        }
      }
    }

    // If that is not possible, we generate the key in a regular way
    // (it still might be generated in hardware, but not in StrongBox)
    if (null == secretKey || !isStrongboxAvailable.get()) {
      try {
        secretKey = tryGenerateRegularSecurityKey(alias);
      } catch (GeneralSecurityException fail) {
        Log.e(LOG_TAG, "Regular security storage is not available.", fail);
        throw fail;
      }
    }
  }

  @NonNull
  protected Key tryGenerateRegularSecurityKey(@NonNull final String alias)
    throws GeneralSecurityException {
    final KeyGenParameterSpec specification = getKeyGenSpecBuilder(alias)
      .build();

    return generateKey(specification);
  }

  @NonNull
  protected Key tryGenerateStrongBoxSecurityKey(@NonNull final String alias)
    throws GeneralSecurityException {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      throw new KeyStoreAccessException("Strong box security keystore is not supported " +
        "for old API" + Build.VERSION.SDK_INT + ".");
    }

    final KeyGenParameterSpec specification = getKeyGenSpecBuilder(alias)
      .setIsStrongBoxBacked(true)
      .build();

    return generateKey(specification);
  }

  //endregion
}
