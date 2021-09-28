package libs.ui;


import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;


import android.app.Activity;

public class KeyboardModule extends ReactContextBaseJavaModule {
    private static final String TAG = "KeyboardModule";
    private static ReactApplicationContext reactContext;

    private static final String KEYBOARD_DID_SHOW_EVENT = "KeyboardShow";
    private static final String KEYBOARD_DID_HIDE_EVENT = "KeyboardHide";

    private int lastKeyboardHeight = 0;
    private KeyboardProvider keyboardProvider;

    KeyboardModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;

        DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context);
    }

    void emit(int height) {
        if (height == lastKeyboardHeight) {
            return;
        }
        lastKeyboardHeight = height;
        // keyboard hide
        if (height == 0) {
            this.sendEvent(KEYBOARD_DID_HIDE_EVENT, null);
        } else {
            // keyboard show
            WritableMap endCoordinates = Arguments.createMap();
            endCoordinates.putInt("height", height);

            WritableMap params = Arguments.createMap();
            params.putMap("endCoordinates", endCoordinates);
            this.sendEvent(KEYBOARD_DID_SHOW_EVENT, params);
        }
    }


    @ReactMethod
    public void startKeyboardListener() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (keyboardProvider != null) {
                    return;
                }
                final Activity wActivity = getCurrentActivity();
                if (wActivity == null) {
                    Log.e(TAG, "wActivity is null");
                    return;
                }
                keyboardProvider = new KeyboardProvider(wActivity).init();
                keyboardProvider.setHeightListener(new KeyboardProvider.HeightListener() {
                    @Override
                    public void onHeightChanged(int height) {
                        int value = Math.round(height / DisplayMetricsHolder.getScreenDisplayMetrics().density);
                        emit(value);
                    }
                });

            }
        });
    }


    @ReactMethod
    public void stopKeyboardListen() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (keyboardProvider != null) {
                    keyboardProvider.dismiss();
                    keyboardProvider = null;
                }
            }
        });
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }


    private void sendEvent(String event, Object payload) {
        if (getReactApplicationContext().hasActiveCatalystInstance()) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, payload);
        }
    }


    @Override
    public String getName() {
        return "KeyboardModule";
    }


}

