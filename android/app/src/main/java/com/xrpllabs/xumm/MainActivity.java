package com.xrpllabs.xumm;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.reactnativenavigation.NavigationActivity;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;

import androidx.annotation.Nullable;
import com.reactnativenavigation.react.CommandListenerAdapter;

import libs.security.authentication.Biometric.BiometricModule;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

import java.util.Locale;

public class MainActivity extends NavigationActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // check only one root activity is running at the time
        if (!isTaskRoot()) {
            finish();
            return;
        }


//        new Handler().postDelayed(new Runnable() {
//            @Override
//            public void run() {
//                ReactApplicationContext reactContext = (ReactApplicationContext)((MainApplication)getApplication()).getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
//                Keychain keychain = new Keychain(reactContext);
//
//
//
//                keychain.getItem("xumm-realm-key");
//            }
//        }, 1000);

        // initialise required modules
        BiometricModule.initialise();

        // set splash screen
        setSplashLayout();
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        navigator.handleBack(new CommandListenerAdapter());
    }

    private void setSplashLayout() {
        setContentView(R.layout.activity_splash);
    }

    @Override
    protected void attachBaseContext(Context newBase) {
        final Configuration override = new Configuration(newBase.getResources().getConfiguration());
        // disable font scaling
        override.fontScale = 1.0f;
        // A workaround for AndroidKeyStore bug in RTL languages
        override.setLocale(Locale.ENGLISH);
        
        applyOverrideConfiguration(override);
        super.attachBaseContext(newBase);
    }
}
