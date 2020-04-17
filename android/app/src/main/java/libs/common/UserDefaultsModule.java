package libs.common;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;


public class UserDefaultsModule extends ReactContextBaseJavaModule {
    private String preferencesName = "xumm";

    private final ReactApplicationContext reactContext;

    public UserDefaultsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UserDefaultsModule";
    }

    @ReactMethod
    public void get(String key, Promise promise) {
        promise.resolve(getPreferences().getString(key, null));
    }

    @ReactMethod
    public void set(String key, String value, Promise promise) {
        getEditor().putString(key, value).commit();
        promise.resolve(null);
    }

    @ReactMethod
    public void del(String key, Promise promise) {
        getEditor().remove(key).commit();
        promise.resolve(null);
    }


    private SharedPreferences getPreferences() {
        return getReactApplicationContext().getSharedPreferences(preferencesName, Context.MODE_PRIVATE);
    }
    private SharedPreferences.Editor getEditor() {
        return getPreferences().edit();
    }
}