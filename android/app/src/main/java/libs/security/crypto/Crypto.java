package libs.security.crypto;

import androidx.annotation.NonNull;

import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class Crypto {
    public enum AESAlgo {
        CBC,
        GCM
    }

    @NonNull
    public static byte[] HexToBytes(@NonNull final String hexString) throws RuntimeException {
        char[] chars = hexString.toCharArray();
        int len = chars.length;

        if ((len & 0x01) != 0) {
            throw new RuntimeException("Odd number of characters.");
        }
        byte[] out = new byte[len >> 1];
        // two characters form the hex value.
        for (int i = 0, j = 0; j < len; i++) {
            int f = Character.digit(chars[j], 16) << 4;
            j++;
            f = f | Character.digit(chars[j], 16);
            j++;
            out[i] = (byte) (f & 0xFF);
        }

        return out;
    }

    @NonNull
    public static String BytesToHex(@NonNull final byte[] data) {
        final char[] HEX_DIGITS = {
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
        };

        int l = data.length;
        char[] out = new char[l << 1];

        // two characters form the hex value.
        for (int i = 0, j = 0; i < l; i++) {
            out[j++] = HEX_DIGITS[(0xF0 & data[i]) >>> 4];
            out[j++] = HEX_DIGITS[0x0F & data[i]];
        }

        return new String(out);
    }

    @NonNull
    public static byte[] SHA1Hash(@NonNull final byte[] data) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        digest.update(data);
        return digest.digest();
    }


    @NonNull
    public static byte[] SHA256Hash(@NonNull final byte[] data) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(data);
        return digest.digest();
    }

    @NonNull
    public static byte[] SHA512Hash(@NonNull final byte[] data) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-512");
        digest.update(data);
        return digest.digest();
    }

    @NonNull
    public static byte[] HMAC256(@NonNull final byte[] data, @NonNull final byte[] key) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac HmacSha256 = Mac.getInstance("HmacSHA256");
        SecretKey secretKey = new SecretKeySpec(key, "HmacSHA256");
        HmacSha256.init(secretKey);
        return HmacSha256.doFinal(data);
    }

    @NonNull
    public static byte[] PBKDF2(@NonNull final char[] password, @NonNull final byte[] salt, @NonNull final int iteration) throws NoSuchAlgorithmException, InvalidKeySpecException {
        // constants
        final String HMAC_HASH_ALGO = "PBKDF2WithHmacSHA512";
        final int KEY_LENGTH = 32 * 8; // 256 bits = 32 bytes

        SecretKeyFactory factory = SecretKeyFactory.getInstance(HMAC_HASH_ALGO);
        PBEKeySpec keySpec = new PBEKeySpec(password, salt, iteration, KEY_LENGTH);
        SecretKey hash = factory.generateSecret(keySpec);
        return hash.getEncoded();
    }

    @NonNull
    public static byte[] RandomBytes(@NonNull final Integer length) {
        byte[] bytes = new byte[length];
        SecureRandom rand = new SecureRandom();
        rand.nextBytes(bytes);
        return bytes;
    }


    public static byte[] AESDecrypt(
            @NonNull final AESAlgo algo,
            @NonNull final byte[] data,
            @NonNull final byte[] key,
            @NonNull final byte[] iv,
            @NonNull final byte[] aad
    ) throws Exception {
        switch (algo) {
            case CBC:
                return AESCBC.decrypt(data, key, iv);
            case GCM:
                return AESGCM.decrypt(data, key, iv, aad);
            default:
                throw new UnsupportedOperationException();
        }
    }

    public static byte[] AESEncrypt(
            @NonNull final AESAlgo algo,
            @NonNull final byte[] data,
            @NonNull final byte[] key,
            @NonNull final byte[] iv,
            final byte[] aad
    ) throws Exception {
        switch (algo) {
            case CBC:
                return AESCBC.encrypt(data, key, iv);
            case GCM:
                return AESGCM.encrypt(data, key, iv, aad);
            default:
                throw new UnsupportedOperationException();
        }
    }

    private static class AESCBC {
        private static final String KEY_ALGORITHM = "AES";
        private static final String CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding";

        @Deprecated
        private static byte[] encrypt(
                @NonNull final byte[] data,
                @NonNull final byte[] key,
                @NonNull final byte[] iv
        ) {
            throw new UnsupportedOperationException();
        }

        private static byte[] decrypt(
                @NonNull final byte[] data,
                @NonNull final byte[] key,
                @NonNull final byte[] iv
        ) throws Exception {
            SecretKey secretKey = new SecretKeySpec(key, KEY_ALGORITHM);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));
            return cipher.doFinal(data);
        }
    }

    private static class AESGCM {
        private static final String KEY_ALGORITHM = "AES";
        private static final String CIPHER_ALGORITHM = "AES/GCM/NoPadding";

        public static byte[] encrypt(
                @NonNull final byte[] data,
                @NonNull final byte[] key,
                @NonNull final byte[] iv,
                @NonNull final byte[] aad
        ) throws Exception {
            return process(data, key, iv, aad, Operation.encrypt);
        }

        public static byte[] decrypt(
                @NonNull final byte[] data,
                @NonNull final byte[] key,
                @NonNull final byte[] iv,
                @NonNull final byte[] aad
        ) throws Exception {
            return process(data, key, iv, aad, Operation.decrypt);
        }

        private static byte[] process(
                @NonNull final byte[] data,
                @NonNull final byte[] key,
                @NonNull final byte[] iv,
                @NonNull final byte[] aad,
                @NonNull final Operation operation
        ) throws Exception {
            SecretKey secretKey = new SecretKeySpec(key, KEY_ALGORITHM);
            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(operation.getCipherMode(), secretKey, new IvParameterSpec(iv));
            cipher.updateAAD(aad);
            return cipher.doFinal(data);
        }


        private enum Operation {
            encrypt(Cipher.ENCRYPT_MODE),
            decrypt(Cipher.DECRYPT_MODE);

            private final int cipherMode;

            public int getCipherMode() {
                return this.cipherMode;
            }

            Operation(int mode) {
                this.cipherMode = mode;
            }
        }

    }


}
