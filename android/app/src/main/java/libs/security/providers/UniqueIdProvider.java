package libs.security.providers;

import android.annotation.SuppressLint;
import android.content.Context;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Map;
import java.util.Objects;

import libs.security.crypto.Crypto;
import libs.security.vault.storage.Keychain;

public class UniqueIdProvider {
    private static final String UNIQUE_DEVICE_ID_KEY = "device-unique-id";

    private Context applicationContent;
    private Keychain keychain;

    public synchronized UniqueIdProvider init(final ReactApplicationContext context) {
        if (context == null) {
            throw new IllegalArgumentException("Context is required");
        }

        applicationContent = context.getApplicationContext();
        keychain = new Keychain(context);

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


    private void saveDeviceUniqueId(String unique_id) {
        try{
            keychain.setItem(UNIQUE_DEVICE_ID_KEY, "", unique_id);
        } catch (Exception e) {
            // ignore
        }
    }

    @Nullable
    private  String loadDeviceUniqueId() {
        try{
            Map<String, String> item = keychain.getItem(UNIQUE_DEVICE_ID_KEY);

            if (item != null) {
                return Objects.requireNonNull(item.get("password"));
            }
            return null;
        } catch (Exception e) {
            return null;
        }
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
        if (applicationContent == null) {
            throw new RuntimeException("Context is required");
        }

        // look for device unique id in the Keychain
        String unique_id = loadDeviceUniqueId();

        // if empty then get the unique id from Settings.Secure.ANDROID_ID and store in keychain
        if (TextUtils.isEmpty(unique_id)) {
            unique_id = getAndroidId(applicationContent);

            // check we got the right values
            if (unique_id == null || unique_id.equalsIgnoreCase("android_id")) {
                return null;
            }

            // store the android_id in SharedPreferences
            saveDeviceUniqueId(unique_id);
        }

       return unique_id;
    }
}
