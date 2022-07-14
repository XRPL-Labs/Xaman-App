package libs.ui;

import android.content.Context;
import android.os.Vibrator;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class HapticFeedbackModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    HapticFeedbackModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "HapticFeedbackModule";
    }

    // From:
    // https://github.com/junina-de/react-native-haptic-feedback
    @ReactMethod
    public void trigger(String type) {
        Vibrator vibrator = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
        // no vibrator service is available
        if (vibrator == null) return;

        long[] durations = {0, 20};

        switch (type) {
            case "impactLight":
                durations = new long[]{0, 20};
                break;
            case "impactMedium":
                durations = new long[]{0, 40};
                break;
            case "impactHeavy":
                durations = new long[]{0, 60};
                break;
            case "notificationSuccess":
                durations = new long[]{0, 40, 60, 20};
                break;
            case "notificationWarning":
                durations = new long[]{0, 20, 60, 40};
                break;
            case "notificationError":
                durations = new long[]{0, 20, 40, 30, 40, 40};
                break;
        }

        vibrator.vibrate(durations, -1);
    }

}
