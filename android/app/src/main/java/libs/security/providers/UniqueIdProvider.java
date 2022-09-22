package libs.security.providers;

import static android.provider.Settings.Secure.getString;

import android.annotation.SuppressLint;
import android.content.Context;
import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;

import libs.security.crypto.Crypto;

public class UniqueIdProvider {
    private String androidId;
    private Context reactContext;

    public synchronized UniqueIdProvider init(final ReactApplicationContext context) {
        if (context == null) {
            throw new IllegalArgumentException("Context is required");
        }

        reactContext = context.getApplicationContext();

        return this;
    }

    public static UniqueIdProvider sharedInstance() {
        return SingletonHolder.instance;
    }

    private static class SingletonHolder {
        static final UniqueIdProvider instance = new UniqueIdProvider();
    }

    public synchronized byte[] getDeviceUniqueIdBytes() {
        String deviceUniqueId = getDeviceUniqueId();

        if (deviceUniqueId == null) {
            return null;
        }

        StringBuilder uniqueId = new StringBuilder(getDeviceUniqueId());
        // in some android devices the leading zero's in android id can be omitted
        // as android id is represented as hex we can add leading zero's
        // NOTE: leading zeros are absent from the value; it's supposed to be a 64-bit value
        while (uniqueId.length() < 16) {
            uniqueId.insert(0, "0");
        }

        return Crypto.HexToBytes(uniqueId.toString());
    }

    @SuppressLint("HardwareIds")
    public synchronized String getDeviceUniqueId() {
        // check if context is already initiated
        if (reactContext == null) {
            throw new RuntimeException("Context is required");
        }

        // if value already exist then return
        if (androidId != null) {
            return androidId;
        }

        androidId = getString(reactContext.getApplicationContext().getContentResolver(), Settings.Secure.ANDROID_ID);

        // check the value
        if (androidId == null || androidId.equalsIgnoreCase("android_id")) {
            return null;
        }
        return androidId;
    }
}
