package libs.security.providers;

import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import static android.provider.Settings.Secure.getString;

@ReactModule(name = "UniqueIdProviderModule")
public class UniqueIdProviderModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext mReactContext;
    private String android_id;

    public UniqueIdProviderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
        android_id = null;
    }

    @Override
    public String getName() {
        return "UniqueIdProviderModule";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getDeviceUniqueId() {
        // if value already exist then return
        if(android_id != null){
            return android_id;
        }
        android_id = getString(getReactApplicationContext().getContentResolver(), Settings.Secure.ANDROID_ID);
        if (android_id == null || android_id.equalsIgnoreCase("android_id")) {
            return null;
        }
        return android_id;
    }
}
