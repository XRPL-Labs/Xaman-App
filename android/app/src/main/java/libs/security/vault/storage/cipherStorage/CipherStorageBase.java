/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage.cipherStorage;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

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
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

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

  /** Extract existing key or generate a new one. In case of problems raise exception. */
  @NonNull
  protected Key extractGeneratedKey(@NonNull final String safeAlias, @NonNull final AtomicInteger retries)
    throws GeneralSecurityException {
    Key key;

    do {
      final KeyStore keyStore = getKeyStoreAndLoad();

      // if key is not available yet, try to generate the strongest possible
      if (!keyStore.containsAlias(safeAlias)) {
        generateKeyAndStoreUnderAlias(safeAlias);
      }

      // throw exception if cannot extract key in several retries
      key = extractKey(keyStore, safeAlias, retries);
    } while (null == key);

    return key;
  }

  /** Try to extract key by alias from keystore, in case of 'known android bug' reduce retry counter. */
  @Nullable
  protected Key extractKey(@NonNull final KeyStore keyStore,
                           @NonNull final String safeAlias,
                           @NonNull final AtomicInteger retry)
    throws GeneralSecurityException {
    final Key key;

    // Fix for android.security.KeyStoreException: Invalid key blob
    // more info: https://stackoverflow.com/questions/36488219/android-security-keystoreexception-invalid-key-blob/36846085#36846085
    try {
      key = keyStore.getKey(safeAlias, null);
    } catch (final UnrecoverableKeyException ex) {
      // try one more time
      if (retry.getAndDecrement() > 0) {
        keyStore.deleteEntry(safeAlias);

        return null;
      }

      throw ex;
    }

    // null if the given alias does not exist or does not identify a key-related entry.
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
