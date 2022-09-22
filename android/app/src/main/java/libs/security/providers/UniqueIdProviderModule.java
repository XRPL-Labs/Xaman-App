package libs.security.providers;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import androidx.annotation.NonNull;

@ReactModule(name = UniqueIdProviderModule.NAME)
public class UniqueIdProviderModule extends ReactContextBaseJavaModule {

    public UniqueIdProviderModule(ReactApplicationContext reactContext) {
        super(reactContext);

        // init UniqueIdProvider shared instance
        UniqueIdProvider.sharedInstance().init(reactContext);
    }

    static final String NAME = "UniqueIdProviderModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getDeviceUniqueId() {
        return UniqueIdProvider.sharedInstance().getDeviceUniqueId();
    }
}
