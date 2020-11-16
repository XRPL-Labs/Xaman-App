package libs.crypto.modules;

import java.security.SecureRandom;
import java.util.UUID;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;

import java.nio.charset.StandardCharsets;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.Mac;

import android.util.Base64;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import libs.crypto.encoder.Hex;

public class CryptoModule extends ReactContextBaseJavaModule {

    private static final String CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding";
    public static final String HMAC_SHA_256 = "HmacSHA256";
    private static final String KEY_ALGORITHM = "AES";

    public CryptoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CryptoModule";
    }

    @ReactMethod
    public void encrypt(String data, String key, Promise promise) {
        try {
            WritableMap result = encrypt(data, key);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void decrypt(String data, String key, String iv, Promise promise) {
        try {
            String plain = decrypt(data, key, iv);
            promise.resolve(plain);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void hmac256(String data, String pwd, Promise promise) {
        try {
            String strs = hmac256(data, pwd);
            promise.resolve(strs);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha256(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-256");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha1(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-1");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha512(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-512");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void randomUUID(Promise promise) {
        try {
            String result = UUID.randomUUID().toString();
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void randomKey(Integer length, Promise promise) {
        try {
            String randomKey = random(length);
            promise.resolve(randomKey);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String randomKeySync(Integer length) {
        return random(length);
    }


    private static String shaX(String data, String algorithm) throws Exception {
        MessageDigest md = MessageDigest.getInstance(algorithm);
        md.update(data.getBytes());
        byte[] digest = md.digest();
        return bytesToHex(digest);
    }

    public static String bytesToHex(byte[] bytes) {
        final char[] hexArray = "0123456789abcdef".toCharArray();
        char[] hexChars = new char[bytes.length * 2];
        for ( int j = 0; j < bytes.length; j++ ) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }

    private static String hmac256(String text, String key) throws NoSuchAlgorithmException, InvalidKeyException  {
        byte[] contentData = text.getBytes(StandardCharsets.UTF_8);
        byte[] akHexData = Hex.decodeHex(key);
        Mac sha256_HMAC = Mac.getInstance(HMAC_SHA_256);
        SecretKey secret_key = new SecretKeySpec(akHexData, HMAC_SHA_256);
        sha256_HMAC.init(secret_key);
        return bytesToHex(sha256_HMAC.doFinal(contentData));
    }

    final static IvParameterSpec emptyIvSpec = new IvParameterSpec(new byte[] {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00});

    private static WritableMap encrypt(String data, String key) throws Exception {
        if (data == null || data.length() == 0) {
            return null;
        }

        // encrypt key
        String keyEnc = shaX(key, "SHA-256");
        // generate random IV
        String hexIv = random(16);

        byte[] keyBytes = Hex.decodeHex(keyEnc);
        SecretKey secretKey = new SecretKeySpec(keyBytes, KEY_ALGORITHM);

        Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, hexIv == null ? emptyIvSpec : new IvParameterSpec(Hex.decodeHex(hexIv)));
        byte[] encrypted = cipher.doFinal(data.getBytes("UTF-8"));

        WritableMap result = Arguments.createMap();

        result.putString("cipher", Base64.encodeToString(encrypted, Base64.NO_WRAP));
        result.putString("iv", hexIv);

        return result;
    }

    private static String decrypt(String cipherText, String key, String hexIv) throws Exception {
        if(cipherText == null || cipherText.length() == 0) {
            return null;
        }
        // encrypt key
        String keyEnc = shaX(key, "SHA-256");

        byte[] keyBytes = Hex.decodeHex(keyEnc);
        SecretKey secretKey = new SecretKeySpec(keyBytes, KEY_ALGORITHM);

        Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, hexIv == null ? emptyIvSpec : new IvParameterSpec(Hex.decodeHex(hexIv)));
        byte[] decrypted = cipher.doFinal(Base64.decode(cipherText, Base64.NO_WRAP));
        return new String(decrypted, "UTF-8");
    }

    private static String random(Integer length) {
        byte[] key = new byte[length];
        SecureRandom rand = new SecureRandom();
        rand.nextBytes(key);
        String keyHex = bytesToHex(key);
        return keyHex;
    }

    
}