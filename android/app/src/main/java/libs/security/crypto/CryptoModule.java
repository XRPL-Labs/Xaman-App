package libs.security.crypto;

import java.nio.charset.StandardCharsets;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;


@ReactModule(name = CryptoModule.NAME)
public class CryptoModule extends ReactContextBaseJavaModule {
    public CryptoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    static final String NAME = "CryptoModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void hmac256(String input, String key, Promise promise) {
        try {
            byte[] data = Crypto.HMAC256(input.getBytes(StandardCharsets.UTF_8), Crypto.HexToBytes(key));
            promise.resolve(Crypto.BytesToHex(data));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha1(String input, Promise promise) {
        try {
            byte[] data = Crypto.SHA1Hash(input.getBytes(StandardCharsets.UTF_8));
            promise.resolve(Crypto.BytesToHex(data));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha256(String input, Promise promise) {
        try {
            byte[] data = Crypto.SHA256Hash(input.getBytes(StandardCharsets.UTF_8));
            promise.resolve(Crypto.BytesToHex(data));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }


    @ReactMethod
    public void sha512(String input, Promise promise) {
        try {
            byte[] data = Crypto.SHA512Hash(input.getBytes(StandardCharsets.UTF_8));
            promise.resolve(Crypto.BytesToHex(data));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void randomKey(Integer length, Promise promise) {
        try {
            byte[] randomBytes = Crypto.RandomBytes(length);
            promise.resolve(Crypto.BytesToHex(randomBytes));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String randomKeySync(Integer length) {
        byte[] randomBytes = Crypto.RandomBytes(length);
        return Crypto.BytesToHex(randomBytes);
    }
}
