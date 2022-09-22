package libs.security.vault.cipher;

import androidx.annotation.NonNull;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import libs.security.crypto.Crypto;
import libs.security.providers.UniqueIdProvider;
import libs.security.vault.exceptions.CryptoFailedException;

public class CipherV2AesGcm {
    public static final int CIPHER_VERSION = 2;

    public static int getCipherVersion() {
        return CIPHER_VERSION;
    }

    @NonNull
    public static Map<String, Object> encrypt(@NonNull final String input, @NonNull final String key) throws CryptoFailedException {
        try {
            final byte[] passcodeSalt = Crypto.RandomBytes(32);
            final byte[] passcodeHash = Crypto.PBKDF2(key.toCharArray(), passcodeSalt);
            final byte[] uniqueDeviceId = UniqueIdProvider.sharedInstance().getDeviceUniqueIdBytes();

            if (uniqueDeviceId == null) {
                throw new CryptoFailedException("uniqueDeviceId is nil", null);
            }

            final byte[] preKeySalt = Crypto.RandomBytes(32);

            ByteArrayOutputStream preKeyStream = new ByteArrayOutputStream();
            preKeyStream.write(preKeySalt);
            preKeyStream.write(passcodeHash);
            preKeyStream.write(uniqueDeviceId);

            // as PBKDF2 password only accepts chart[] we need to turn preKey byte to hex char[]
            char[] preKey = Crypto.BytesToHex(preKeyStream.toByteArray()).toCharArray();

            final byte[] encrKeySalt = Crypto.RandomBytes(32);
            final byte[] encrKey = Crypto.PBKDF2(preKey, encrKeySalt);
            final byte[] iv = Crypto.RandomBytes(32);
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

            return result;
        } catch (Exception e) {
            throw new CryptoFailedException("CipherV2AesGcm encryption error", e);
        }
    }

    @NonNull
    public static String decrypt(@NonNull final String cipher, @NonNull final String key, @NonNull final Cipher.DerivedKeys derivedKeys) throws CryptoFailedException {
        try {

            final byte[] passcodeHash = Crypto.PBKDF2(key.toCharArray(), Crypto.HexToBytes(derivedKeys.passcode_salt));
            final byte[] uniqueDeviceId = UniqueIdProvider.sharedInstance().getDeviceUniqueIdBytes();

            ByteArrayOutputStream preKeyStream = new ByteArrayOutputStream();
            preKeyStream.write(Crypto.HexToBytes(derivedKeys.pre_key_salt));
            preKeyStream.write(passcodeHash);
            preKeyStream.write(uniqueDeviceId);

            // as PBKDF2 password only accepts chart[] we need to turn preKey byte to hex char[]
            char[] preKey = Crypto.BytesToHex(preKeyStream.toByteArray()).toCharArray();

            final byte[] encrKey = Crypto.PBKDF2(preKey, Crypto.HexToBytes(derivedKeys.encr_key_salt));

            final byte[] decryptedBytes = Crypto.AESDecrypt(
                    Crypto.AESAlgo.GCM,
                    Crypto.HexToBytes(cipher),
                    encrKey,
                    Crypto.HexToBytes(derivedKeys.iv),
                    uniqueDeviceId
            );

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new CryptoFailedException("CipherV2AesGcm decryption error", e);
        }
    }
}
