package libs.security;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import libs.security.crypto.CryptoModule;
import libs.security.authentication.Biometric.BiometricModule;
import libs.security.providers.UniqueIdProviderModule;
import libs.security.vault.VaultManagerModule;

public class SecurityPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new CryptoModule(reactContext),
                new BiometricModule(reactContext),
                new UniqueIdProviderModule(reactContext),
                new VaultManagerModule(reactContext)
        );
    }

    // Deprecated from RN 0.47.0
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
