package libs.security.providers;

import android.annotation.SuppressLint;
import android.content.Context;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

import libs.security.crypto.Crypto;

public class UniqueIdProvider {
    private static final String UNIQUE_DEVICE_ID_KEY = "device_unique_id";
    private static final String UNIQUE_ID_KEY = "unique_id";

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


    @SuppressLint("HardwareIds")
    private static String getAndroidId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
    }


    private static void saveDeviceUniqueId(Context context, String unique_id) {
        context.getSharedPreferences(UNIQUE_DEVICE_ID_KEY, Context.MODE_PRIVATE)
                .edit()
                .putString(UNIQUE_ID_KEY, unique_id)
                .apply();
    }

    @Nullable
    private static String loadDeviceUniqueId(Context context) {
        return context.getSharedPreferences(UNIQUE_DEVICE_ID_KEY, Context.MODE_PRIVATE)
                .getString(UNIQUE_ID_KEY, null);
    }

    @Nullable
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
    @Nullable
    public synchronized String getDeviceUniqueId() {
        // check if context is already initiated
        if (reactContext == null) {
            throw new RuntimeException("Context is required");
        }

        // look for device unique id in the SharedPreferences
        String unique_id = loadDeviceUniqueId(reactContext);

        // if empty then get the unique id from Settings.Secure.ANDROID_ID and save
        if (TextUtils.isEmpty(unique_id)) {
            unique_id = getAndroidId(reactContext);

            // check we got the right values
            if (unique_id == null || unique_id.equalsIgnoreCase("android_id")) {
                return null;
            }

            // store the android_id in SharedPreferences
            saveDeviceUniqueId(reactContext, unique_id);
        }

       return unique_id;
    }
}
