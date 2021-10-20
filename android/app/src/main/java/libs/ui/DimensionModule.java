package libs.ui;

import android.app.Activity;
import android.view.View;
import android.view.WindowInsets;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.PixelUtil;

import java.util.Map;
import java.util.HashMap;

public class DimensionModule extends ReactContextBaseJavaModule {
    private static final String TAG = "DimensionModule";
    private static ReactApplicationContext reactContext;

    DimensionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "DimensionModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("layoutInsets", this._getLayoutInsets());
        return constants;
    }

    private Map<String, Object> _getLayoutInsets() {
        final Map<String, Object> layoutInsets = new HashMap<>();
        final Activity activity = getCurrentActivity();

        if (activity != null) {
            final View view = activity.getWindow().getDecorView();
            final WindowInsets insets = view.getRootWindowInsets();

            layoutInsets.put("top", Math.round(PixelUtil.toDIPFromPixel(insets.getSystemWindowInsetTop())));
            layoutInsets.put("bottom", Math.round(PixelUtil.toDIPFromPixel(insets.getSystemWindowInsetBottom())));
        } else {
            layoutInsets.put("top", 0);
            layoutInsets.put("bottom", 0);
        }

        return layoutInsets;
    }

    @ReactMethod
    public void getLayoutInsets(Promise promise) {
        WritableMap result = Arguments.createMap();

        Map layoutInsets = this._getLayoutInsets();

        Integer top = (Integer) layoutInsets.get("top");
        Integer bottom = (Integer) layoutInsets.get("bottom");

        if (top == null || bottom == null) {
            promise.reject("-1", "Unable to fetch layout insets!");
            return;
        }

        result.putInt("top", top);
        result.putInt("bottom", top);

        promise.resolve(result);
    }


}