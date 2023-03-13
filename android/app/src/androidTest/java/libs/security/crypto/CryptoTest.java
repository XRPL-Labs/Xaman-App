package libs.security.crypto;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@RunWith(AndroidJUnit4.class)
public class CryptoTest {
    @Test
    public void BytesToHexTest() {
        Assert.assertEquals("0000000000000000", Crypto.BytesToHex(new byte[8]));
        Assert.assertEquals("00", Crypto.BytesToHex(new byte[1]));
        Assert.assertEquals("0a", Crypto.BytesToHex(
                new byte[]{10}
        ));
        Assert.assertEquals("000000000000000a", Crypto.BytesToHex(
                new byte[]{0, 0, 0, 0, 0, 0, 0, 10}
        ));
        Assert.assertEquals("0100", Crypto.BytesToHex(new byte[]{1, 0}));
        Assert.assertEquals("0000000000000101", Crypto.BytesToHex(new byte[]
                {0, 0, 0, 0, 0, 0, 1, 1}
        ));
    }


    @Test
    public void HexToBytesTest() {
        Assert.assertArrayEquals(new byte[]{0}, Crypto.HexToBytes("00"));
        Assert.assertArrayEquals(new byte[]{10}, Crypto.HexToBytes("0a"));
        Assert.assertArrayEquals(new byte[]{10}, Crypto.HexToBytes("0A"));
        Assert.assertArrayEquals(new byte[]{1, 0}, Crypto.HexToBytes("0100"));

        // round trip
        final String TEST_STRING = "Hello World";
        final byte[] TEST_BYTES = TEST_STRING.getBytes(StandardCharsets.UTF_8);

        Assert.assertArrayEquals(TEST_BYTES, Crypto.HexToBytes(Crypto.BytesToHex(TEST_BYTES)));

        // Odd number of hex characters
        try {
            Crypto.HexToBytes("aaa");
        } catch (RuntimeException e) {
            Assert.assertEquals(e.getMessage(), "Odd number of characters.");
        }
    }

    @Test
    public void SHA1Test() throws NoSuchAlgorithmException {
        // echo -n "Hello World" | openssl sha1
        final byte[] BYTES = "Hello World".getBytes(StandardCharsets.UTF_8);
        final byte[] BYTE_SHA1 = Crypto.HexToBytes("0a4d55a8d778e5022fab701977c5d840bbc486d0");
        Assert.assertArrayEquals(BYTE_SHA1, Crypto.SHA1Hash(BYTES));
    }

    @Test
    public void SHA256Test() throws NoSuchAlgorithmException {
        // echo -n "Hello World" | openssl sha256
        final byte[] BYTES = "Hello World".getBytes(StandardCharsets.UTF_8);
        final byte[] BYTE_SHA256 = Crypto.HexToBytes("a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e");
        Assert.assertArrayEquals(BYTE_SHA256, Crypto.SHA256Hash(BYTES));
    }

    @Test
    public void SHA512Test() throws NoSuchAlgorithmException {
        // echo -n "Hello World" | openssl sha512
        final byte[] BYTES = "Hello World".getBytes(StandardCharsets.UTF_8);
        final byte[] BYTE_SHA512 = Crypto.HexToBytes("2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b");
        Assert.assertArrayEquals(BYTE_SHA512, Crypto.SHA512Hash(BYTES));
    }

    @Test
    public void HMAC256Test() throws NoSuchAlgorithmException, InvalidKeyException {
        // echo -n "Hello World" | openssl sha256 -hmac "Secret Key"
        final byte[] BYTES = "Hello World".getBytes(StandardCharsets.UTF_8);
        final byte[] BYTES_KEY = "Secret Key".getBytes(StandardCharsets.UTF_8);
        final byte[] BYTE_HMAC256 = Crypto.HexToBytes("ba4f7d6c4547be22bd697e0610575ad7068ba7086e17dea752a97476fc2be9ba");
        Assert.assertArrayEquals(BYTE_HMAC256, Crypto.HMAC256(BYTES, BYTES_KEY));
    }


    @Test
    public void PBKDF2Test() throws NoSuchAlgorithmException, java.security.spec.InvalidKeySpecException {
        final char[] CHARS = "Hello World".toCharArray();
        final byte[] BYTES_SALT = Crypto.HexToBytes("e263d5ca3f8664326a453b6f6f34c67551ed9ea9e67e4fb1bfe51010f3dc5354");
        final byte[] BYTE_PBKDF2 = Crypto.HexToBytes("3f6baa35c545b1815761d32e26fe381d53a1673518f9880e9258280c5e25b632");
        Assert.assertArrayEquals(BYTE_PBKDF2, Crypto.PBKDF2(CHARS, BYTES_SALT, 91337));
    }

    @Test
    public void RandomBytesTest() {
        final int BYTES_LENGTH = 64;
        final byte[] RANDOM_BYTES = Crypto.RandomBytes(BYTES_LENGTH);
        Assert.assertEquals(BYTES_LENGTH, RANDOM_BYTES.length);
    }


    @Test
    public void AESCBCTest() throws Exception {
        final String CLEAR_TEXT = "Hello World";
        final byte[] BYTES = CLEAR_TEXT.getBytes(StandardCharsets.UTF_8);

        final byte[] IV = Crypto.HexToBytes("e263d5ca3f8664326a453b6f6f34c675");
        final byte[] SECRET_KEY = Crypto.HexToBytes("eeefa4cae35abf41b3c4e60f71bc1f669af346097b6afb7b59ae2d7697a1fbac");
        final byte[] CIPHER = Crypto.HexToBytes("60a38734aea1098767823e7c2f697676");

        // ===== Encrypt =====
        // Should throw error as this method for CBC is deprecated
        try {
            Crypto.AESEncrypt(
                    Crypto.AESAlgo.CBC,
                    BYTES,
                    SECRET_KEY,
                    IV,
                    new byte[0]
            );
        } catch (Exception e) {
            Assert.assertEquals(
                    UnsupportedOperationException.class.getCanonicalName(),
                    e.getClass().getCanonicalName()
            );
        }

        // ===== DECRYPT =====
        Assert.assertArrayEquals(
                CLEAR_TEXT.getBytes(StandardCharsets.UTF_8),
                Crypto.AESDecrypt(
                        Crypto.AESAlgo.CBC,
                        CIPHER,
                        SECRET_KEY,
                        IV,
                        null
                )
        );
    }


    @Test
    public void AESGCMCTest() throws Exception {
        final String CLEAR_TEXT = "Hello World";
        final byte[] BYTES = CLEAR_TEXT.getBytes(StandardCharsets.UTF_8);

        final byte[] IV = Crypto.HexToBytes("e263d5ca3f8664326a453b6f6f34c675");
        final byte[] AAD = Crypto.HexToBytes("ebd2d9021e41355be56862fb103bd59b");
        final byte[] SECRET_KEY = Crypto.HexToBytes("eeefa4cae35abf41b3c4e60f71bc1f669af346097b6afb7b59ae2d7697a1fbac");
        final byte[] CIPHER = Crypto.HexToBytes( "bee15cb4385c670a2a7348ebf6b1b48a747d3d3e0e319b9649fe81");

        // ===== Encrypt =====
        // Should throw error if AAD is null
        try {
            Crypto.AESEncrypt(
                    Crypto.AESAlgo.GCM,
                    CLEAR_TEXT.getBytes(StandardCharsets.UTF_8),
                    SECRET_KEY,
                    IV,
                    null
            );
        } catch (Exception e) {
            Assert.assertEquals(
                    IllegalArgumentException.class.getCanonicalName(),
                    e.getClass().getCanonicalName()
            );
        }

        // round trip
        // try to encrypt the data and get cipher for decrypt
        final byte[] ENCRYPT_RESULT = Crypto.AESEncrypt(
                Crypto.AESAlgo.GCM,
                BYTES,
                SECRET_KEY,
                IV,
                AAD
        );

        // check if we got same cipher
        Assert.assertArrayEquals(CIPHER, ENCRYPT_RESULT);

        // decrypt
        Assert.assertArrayEquals(
                CLEAR_TEXT.getBytes(StandardCharsets.UTF_8),
                Crypto.AESDecrypt(
                        Crypto.AESAlgo.GCM,
                        CIPHER,
                        SECRET_KEY,
                        IV,
                        AAD
                )
        );
    }
}
