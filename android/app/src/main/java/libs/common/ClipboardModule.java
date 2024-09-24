package libs.common;

import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ClipboardModule.NAME)
public class ClipboardModule extends ReactContextBaseJavaModule {
    protected final ReactApplicationContext reactContext;

    public ClipboardModule(ReactApplicationContext reactContext)
    {
        super(reactContext);
        this.reactContext = reactContext;
    }

    public static final String NAME = "ClipboardModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    private ClipboardManager getClipboardService() {
        return (ClipboardManager) reactContext.getSystemService(Context.CLIPBOARD_SERVICE);
    }

    @ReactMethod
    public void getString(Promise promise) {
        try {
            ClipboardManager clipboard = getClipboardService();
            ClipData clipData = clipboard.getPrimaryClip();
            if (clipData != null && clipData.getItemCount() >= 1) {
                ClipData.Item firstItem = clipboard.getPrimaryClip().getItemAt(0);
                promise.resolve("" + firstItem.getText());
            } else {
                promise.resolve("");
            }
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void setString(String text) {
        try {
            ClipData clipdata = ClipData.newPlainText(null, text);
            ClipboardManager clipboard = getClipboardService();
            clipboard.setPrimaryClip(clipdata);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
