package libs.utils;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = AppUtilsModule.NAME)
public class AppUtilsModule extends ReactContextBaseJavaModule {
    protected final ReactApplicationContext reactContext;

    public AppUtilsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    static final String NAME = "AppUtilsModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }


    private String getAppBuildNumber(){
        try {
            PackageInfo pInfo = reactContext.getPackageManager().getPackageInfo(getReactApplicationContext().getPackageName(), 0);
            return Integer.toString(pInfo.versionCode);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String getAppVersion(){
        try {
            PackageInfo pInfo = reactContext.getPackageManager().getPackageInfo(getReactApplicationContext().getPackageName(), 0);
            return pInfo.versionName;
        } catch (Exception e) {
            return "unknown";
        }
    }

    private Boolean isDebug(){
        try {
            ApplicationInfo aInfo = reactContext.getApplicationContext().getApplicationInfo();
            return (aInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("appVersion", this.getAppVersion());
        constants.put("buildNumber", this.getAppBuildNumber());
        constants.put("isDebug", this.isDebug());
        return constants;
    }


    /**
     * @author kristiansorens
     */
    @ReactMethod
    public void setFlagSecure(Boolean enable, Promise promise) {
        final Activity activity = getCurrentActivity();

        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (enable) {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    } else {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    }

                }
            });
        }

        promise.resolve(true);
    }


    @ReactMethod
    public void isFlagSecure(Promise promise) {
        final Activity activity = getCurrentActivity();

        if (activity != null) {
            if ((activity.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } else {
            promise.resolve(false);
        }
    }


    @ReactMethod
    public void restartBundle() {
        PackageManager packageManager = reactContext.getPackageManager();
        Intent intent = packageManager.getLaunchIntentForPackage(reactContext.getPackageName());
        ComponentName componentName = intent.getComponent();
        Intent mainIntent = Intent.makeRestartActivityTask(componentName);
        reactContext.startActivity(mainIntent);
        Runtime.getRuntime().exit(0);
    }

    @ReactMethod
    public void exitApp() {
        android.os.Process.killProcess(android.os.Process.myPid());
        System.exit(1);
    }

    @ReactMethod
    public void timeoutEvent(final String id, final int timeout) {
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (getReactApplicationContext().hasActiveReactInstance()) {
                    getReactApplicationContext()
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("Utils.timeout", id);
                }
            }
        }, timeout);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}
