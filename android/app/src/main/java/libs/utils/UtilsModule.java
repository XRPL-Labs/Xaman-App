package libs.utils;

import java.io.File;
import java.io.BufferedReader;
import java.io.InputStreamReader;

import android.os.Debug;
import android.content.pm.ApplicationInfo;
import android.app.Activity;
import android.view.WindowManager;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.Context;
import android.os.Handler;

import java.util.TimeZone;
import java.util.Calendar;

import android.os.Vibrator;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;


public class UtilsModule extends ReactContextBaseJavaModule {

    protected final ReactApplicationContext reactContext;

    public UtilsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UtilsModule";
    }


    /**
     * @author kristiansorens
     */
    @ReactMethod
    public void flagSecure(Boolean enable, Promise promise) {
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

        if ((activity.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0) {
            promise.resolve(true);
        }else{
            promise.resolve(false);
        }



    }


    /**
     * @author jail-monkey
     */
    @ReactMethod
    public void isDebugged(Promise promise) {
        if (Debug.isDebuggerConnected()) {
            promise.resolve(true);
        }

        boolean isDebug = (reactContext.getApplicationContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        promise.resolve(isDebug);
    }


    /**
     * @author Kevin Kowalewski
     */
    @ReactMethod
    public void isRooted(Promise promise) {
        try {
            boolean isRooted = checkRootMethod1() || checkRootMethod2() || checkRootMethod3();
            promise.resolve(isRooted);
        } catch (Exception e) {
            promise.reject(e);
        }
    }


    @ReactMethod
    public void restartBundle() {
        Intent mStartActivity = reactContext.getPackageManager().getLaunchIntentForPackage(reactContext.getPackageName());
        int mPendingIntentId = 123456;
        PendingIntent mPendingIntent = PendingIntent.getActivity(reactContext, mPendingIntentId, mStartActivity, PendingIntent.FLAG_CANCEL_CURRENT);
        AlarmManager mgr = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 100, mPendingIntent);
        System.exit(0);
    }

    @ReactMethod
    public void exitApp() {
        android.os.Process.killProcess(android.os.Process.myPid());
        System.exit(1);
    }

    @ReactMethod
    public void getElapsedRealtime(Promise promise) {
        // System time in milliseconds
        long time = android.os.SystemClock.elapsedRealtime();

        // React Native bridge complains if we try to pass back a long directly
        promise.resolve(Long.toString(time / 1000));
    }


    @ReactMethod
    public void getTimeZone(Promise promise) {
        try {
            Calendar calendar = Calendar.getInstance(TimeZone.getDefault());
            TimeZone zone = calendar.getTimeZone();
            promise.resolve(zone.getID());
        }catch (Exception e){
            promise.reject(e);
        }
    }


    // From:
    // https://github.com/junina-de/react-native-haptic-feedback
    @ReactMethod
    public void hapticFeedback(String type) {
        Vibrator v = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null) return;
        long durations[] = {0, 20};
        int hapticConstant = 0;

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

        if (hapticConstant != 0) {
            v.vibrate(hapticConstant);
        } else {
            v.vibrate(durations, -1);
        }
    }


    @ReactMethod
    public void timeoutEvent(final String id, final int timeout) {
        Handler handler = new Handler();
        handler.postDelayed(new Runnable(){
            @Override
            public void run(){
                if (getReactApplicationContext().hasActiveCatalystInstance()) {
                    getReactApplicationContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("Utils.timeout", id);
                }
           }
        }, timeout);
    }


    // private methods
    private static boolean checkRootMethod1() {
        String buildTags = android.os.Build.TAGS;
        return buildTags != null && buildTags.contains("test-keys");
    }

    private static boolean checkRootMethod2() {
        String[] paths = {"/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su",
                "/system/bin/failsafe/su", "/data/local/su"};
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    private static boolean checkRootMethod3() {
        Process process = null;
        try {
            process = Runtime.getRuntime().exec(new String[]{"/system/xbin/which", "su"});
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            return in.readLine() != null;
        } catch (Throwable t) {
            return false;
        } finally {
            if (process != null) process.destroy();
        }
    }
}