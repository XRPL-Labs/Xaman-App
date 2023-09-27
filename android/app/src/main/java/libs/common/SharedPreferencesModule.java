package libs.common;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = SharedPreferencesModule.NAME)
public class SharedPreferencesModule extends ReactContextBaseJavaModule {
    private final String PREFERENCES_NAME = "xumm";

    public SharedPreferencesModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    public static final String NAME = "SharedPreferencesModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void get(String key, Promise promise) {
        promise.resolve(getPreferences().getString(key, null));
    }

    @ReactMethod
    public void set(String key, String value, Promise promise) {
        getEditor().putString(key, value).commit();
        promise.resolve(true);
    }

    @ReactMethod
    public void del(String key, Promise promise) {
        getEditor().remove(key).commit();
        promise.resolve(true);
    }


    private SharedPreferences getPreferences() {
        return getReactApplicationContext().getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    private SharedPreferences.Editor getEditor() {
        return getPreferences().edit();
    }
}
