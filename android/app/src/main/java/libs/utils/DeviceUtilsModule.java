package libs.utils;

import android.app.Activity;
import android.os.Build;
import android.view.View;
import android.view.WindowInsets;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.text.DecimalFormatSymbols;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import com.xrpllabs.xumm.SafeAreaInsets;

@ReactModule(name = DeviceUtilsModule.NAME)
public class DeviceUtilsModule extends ReactContextBaseJavaModule {

    protected final ReactApplicationContext reactContext;

    public DeviceUtilsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    static final String NAME = "DeviceUtilsModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
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
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getLocalSetting(Promise promise) {
        try {

            WritableMap settings = Arguments.createMap();

            Locale locale = getReactApplicationContext().getResources().getConfiguration().getLocales().get(0);

            DecimalFormatSymbols symbols = new DecimalFormatSymbols(locale);

            String languageCode = Locale.getDefault().getLanguage();

            settings.putString("locale", String.valueOf(locale));
            settings.putString("languageCode", languageCode);
            settings.putString("separator", String.valueOf(symbols.getDecimalSeparator()));
            settings.putString("delimiter", String.valueOf(symbols.getGroupingSeparator()));

            promise.resolve(settings);

        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        final Map<String, Object> layoutInsets = new HashMap<>();
        final Activity activity = getCurrentActivity();

        layoutInsets.put("top", 0);
        layoutInsets.put("bottom", 0);

        if (activity != null) {
            // final View decorView = activity.getWindow().getDecorView();
            // if view is not isAttachedToWindow getSystemWindowInsetTop can return null
            // if (decorView != null &&  decorView.isAttachedToWindow()) {
            //     final WindowInsets insets = decorView.getRootWindowInsets();
            //     layoutInsets.put("top", Math.round(PixelUtil.toDIPFromPixel(insets.getSystemWindowInsetTop())));
            //     layoutInsets.put("bottom", Math.round(PixelUtil.toDIPFromPixel(insets.getSystemWindowInsetBottom())));
            // }
            layoutInsets.put("top", Math.round(PixelUtil.toDIPFromPixel(SafeAreaInsets.getSafeAreaTop())));
            layoutInsets.put("bottom", Math.round(PixelUtil.toDIPFromPixel(SafeAreaInsets.getSafeAreaBottom())));
        }

        constants.put("osVersion", Build.VERSION.RELEASE);
        constants.put("brand", Build.BRAND);
        constants.put("model", Build.MODEL);
        constants.put("layoutInsets", layoutInsets);

        return constants;
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
