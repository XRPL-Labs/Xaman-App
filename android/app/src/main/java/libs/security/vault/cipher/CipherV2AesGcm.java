package libs.security.vault.cipher;

import androidx.annotation.NonNull;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import libs.security.crypto.Crypto;
import libs.security.providers.UniqueIdProvider;
import libs.security.vault.VaultErrorCodes;
import libs.security.vault.exceptions.CryptoFailedException;

public class CipherV2AesGcm {
    public static final int CIPHER_VERSION = 2;

    public static int getCipherVersion() {
        return CIPHER_VERSION;
    }

    @NonNull
    public static Map<String, Object> encrypt(@NonNull final String input, @NonNull final String key) throws CryptoFailedException {
        try {
            // Stored unique-id (then last-known). Never live ANDROID_ID while a stored id exists.
            // Existing Extra Security vaults are bound to that stored id.
            final String deviceId = UniqueIdProvider.sharedInstance().getDeviceUniqueId();
            final byte[] uniqueDeviceId = UniqueIdProvider.toDeviceIdBytes(deviceId);

            if (uniqueDeviceId == null) {
                throw new CryptoFailedException(
                        VaultErrorCodes.UNIQUE_ID_MISSING,
                        "uniqueDeviceId is null!",
                        null
                );
            }

            final byte[] passcodeSalt = Crypto.RandomBytes(32);

            // NOTE: using "91337" as iteration count is a conscious choice to save performance.
            final byte[] passcodeHash = Crypto.PBKDF2(key.toCharArray(), passcodeSalt, 91337);

            // generate preKeySalt random 32 bytes
            final byte[] preKeySalt = Crypto.RandomBytes(32);

            // preKey = preKeySalt + passcodeHash + uniqueDeviceId
            ByteArrayOutputStream preKeyStream = new ByteArrayOutputStream();
            preKeyStream.write(preKeySalt);
            preKeyStream.write(passcodeHash);
            preKeyStream.write(uniqueDeviceId);

            // as PBKDF2 password only accepts chart[] we need to turn preKey byte to hex char[]
            char[] preKey = Crypto.BytesToHex(preKeyStream.toByteArray()).toCharArray();

            // generate encrKeySalt random 32 bytes
            final byte[] encrKeySalt = Crypto.RandomBytes(32);

            // NOTE: using "33" as iteration count is a conscious choice to save performance.
            final byte[] encrKey = Crypto.PBKDF2(preKey, encrKeySalt, 33);

            // random iv 32 bytes
            final byte[] iv = Crypto.RandomBytes(32);

            // encrypt using AES GCM
            final byte[] encryptedBytes = Crypto.AESEncrypt(
                    Crypto.AESAlgo.GCM,
                    input.getBytes(StandardCharsets.UTF_8),
                    encrKey,
                    iv,
                    uniqueDeviceId
            );

            // generate derived keys
            Cipher.DerivedKeys derivedKeys = new Cipher.DerivedKeys();

            derivedKeys.version = getCipherVersion();
            derivedKeys.iv = Crypto.BytesToHex(iv);
            derivedKeys.passcode_salt = Crypto.BytesToHex(passcodeSalt);
            derivedKeys.pre_key_salt = Crypto.BytesToHex(preKeySalt);
            derivedKeys.encr_key_salt = Crypto.BytesToHex(encrKeySalt);


            Map<String, Object> result = new HashMap<String, Object>();
            result.put("cipher", Crypto.BytesToHex(encryptedBytes));
            result.put("derived_keys", derivedKeys);

            UniqueIdProvider.sharedInstance().persistConfirmedDeviceUniqueId(deviceId, false);

            return result;
        } catch (CryptoFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoFailedException("CipherV2AesGcm encryption error", e);
        }
    }

    @NonNull
    public static String decrypt(@NonNull final String cipher, @NonNull final String key, @NonNull final Cipher.DerivedKeys derivedKeys) throws CryptoFailedException {
        final List<String> candidates = UniqueIdProvider.sharedInstance().getDecryptCandidateIds();

        if (candidates.isEmpty()) {
            throw new CryptoFailedException(
                    VaultErrorCodes.UNIQUE_ID_MISSING,
                    "uniqueDeviceId is null!",
                    null
            );
        }

        UniqueIdProvider uniqueIdProvider = UniqueIdProvider.sharedInstance();
        uniqueIdProvider.clearLastUnlockReport();
        boolean authFailed = false;
        CryptoFailedException lastFailure = null;

        for (String deviceId : candidates) {
            try {
                String clearText = decryptWithDeviceId(cipher, key, derivedKeys, deviceId);
                uniqueIdProvider.recordDecryptSuccess(deviceId);
                uniqueIdProvider.persistConfirmedDeviceUniqueId(deviceId, true);
                return clearText;
            } catch (CryptoFailedException e) {
                lastFailure = e;
                if (VaultErrorCodes.WRONG_PASSPHRASE.equals(e.getCode())) {
                    authFailed = true;
                }
            }
        }

        String code = VaultErrorCodes.WRONG_PASSPHRASE;
        if (!authFailed && lastFailure != null) {
            code = lastFailure.getCode();
        }
        throw new CryptoFailedException(
                code,
                "CipherV2AesGcm decryption failed after " + candidates.size() + " device id(s)",
                lastFailure
        );
    }

    @NonNull
    private static String decryptWithDeviceId(
            @NonNull final String cipher,
            @NonNull final String key,
            @NonNull final Cipher.DerivedKeys derivedKeys,
            @NonNull final String deviceId
    ) throws CryptoFailedException {
        try {
            final byte[] uniqueDeviceId = UniqueIdProvider.toDeviceIdBytes(deviceId);

            if (uniqueDeviceId == null) {
                throw new CryptoFailedException(
                        VaultErrorCodes.UNIQUE_ID_MISSING,
                        "uniqueDeviceId is null!",
                        null
                );
            }

            // NOTE: using "91337" as iteration count is a conscious choice to save performance.
            final byte[] passcodeHash = Crypto.PBKDF2(
                    key.toCharArray(),
                    Crypto.HexToBytes(derivedKeys.passcode_salt),
                    91337
            );

            // preKey = preKeySalt + passcodeHash + uniqueDeviceId
            ByteArrayOutputStream preKeyStream = new ByteArrayOutputStream();
            preKeyStream.write(Crypto.HexToBytes(derivedKeys.pre_key_salt));
            preKeyStream.write(passcodeHash);
            preKeyStream.write(uniqueDeviceId);

            // as PBKDF2 password only accepts chart[] we need to turn preKey byte to hex char[]
            char[] preKey = Crypto.BytesToHex(preKeyStream.toByteArray()).toCharArray();

            // NOTE: using "33" as iteration count is a conscious choice to save performance.
            final byte[] encrKey = Crypto.PBKDF2(
                    preKey,
                    Crypto.HexToBytes(derivedKeys.encr_key_salt),
                    33
            );


            // decrypt using AES GCM
            final byte[] decryptedBytes = Crypto.AESDecrypt(
                    Crypto.AESAlgo.GCM,
                    Crypto.HexToBytes(cipher),
                    encrKey,
                    Crypto.HexToBytes(derivedKeys.iv),
                    uniqueDeviceId
            );

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (CryptoFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoFailedException(
                    Cipher.classifyDecryptFailure(e),
                    "CipherV2AesGcm decryption error",
                    e
            );
        }
    }
}
