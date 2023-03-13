/*
react-native-keychain
Copyright (c) 2015 Joel Arvidsson
 */

package libs.security.vault.storage.cipherStorage;

import androidx.annotation.NonNull;

import java.util.Set;

import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.exceptions.KeyStoreAccessException;

public interface CipherStorage {
  //region Helper classes

  /** basis for storing credentials in different data type formats. */
  abstract class CipherResult<T> {
    public final T username;
    public final T password;

    public CipherResult(final T username, final T password) {
      this.username = username;
      this.password = password;
    }
  }

  /** Credentials in bytes array, often a result of encryption. */
  class EncryptionResult extends CipherResult<byte[]> {
    /** Name of used for encryption cipher storage. */
    public final String cipherName;

    /** Main constructor. */
    public EncryptionResult(final byte[] username, final byte[] password, final String cipherName) {
      super(username, password);
      this.cipherName = cipherName;
    }

    /** Helper constructor. Simplifies cipher name extraction. */
    public EncryptionResult(final byte[] username, final byte[] password, @NonNull final CipherStorage cipherStorage) {
      this(username, password, cipherStorage.getCipherStorageName());
    }
  }

  /** Credentials in string's, often a result of decryption. */
  class DecryptionResult extends CipherResult<String> {
    public DecryptionResult(final String username, final String password) {
      super(username, password);
    }
  }

  //region API

  /** Encrypt credentials with provided key (by alias) */
  @NonNull
  EncryptionResult encrypt(@NonNull final String alias,
                           @NonNull final String username,
                           @NonNull final String password)
    throws CryptoFailedException;

  /**
   * Decrypt credentials with provided key (by alias)
   */
  @NonNull
  DecryptionResult decrypt(@NonNull final String alias,
                           @NonNull final byte[] username,
                           @NonNull final byte[] password)
    throws CryptoFailedException;

  /** Remove key (by alias) from storage. */
  void removeKey(@NonNull final String alias) throws KeyStoreAccessException;

  /**
   * Return all keys present in this storage.
   * @return key aliases
   */
  Set<String> getAllKeys() throws KeyStoreAccessException;


  /** Storage name. */
  String getCipherStorageName();
}
