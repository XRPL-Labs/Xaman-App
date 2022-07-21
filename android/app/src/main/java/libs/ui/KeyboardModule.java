package libs.ui;

import android.app.Activity;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;


@ReactModule(name = KeyboardModule.NAME)
public class KeyboardModule extends ReactContextBaseJavaModule {
    private static final String KEYBOARD_DID_SHOW_EVENT = "KeyboardShow";
    private static final String KEYBOARD_DID_HIDE_EVENT = "KeyboardHide";

    private int lastKeyboardHeight = 0;
    private KeyboardProvider keyboardProvider;

    KeyboardModule(ReactApplicationContext context) {
        super(context);

        DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context);
    }

    public static final String NAME = "KeyboardModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
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
        UiThreadUtil.runOnUiThread(() -> {
            if (keyboardProvider != null) {
                return;
            }
            final Activity wActivity = getCurrentActivity();
            if (wActivity == null) {
                return;
            }
            keyboardProvider = new KeyboardProvider(wActivity).init();
            keyboardProvider.setHeightListener(height -> {
                int value = Math.round(height / DisplayMetricsHolder.getScreenDisplayMetrics().density);
                emit(value);
            });

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
        if (getReactApplicationContext().hasActiveReactInstance()) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(event, payload);
        }
    }
}

