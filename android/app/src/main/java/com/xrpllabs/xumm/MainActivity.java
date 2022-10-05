package com.xrpllabs.xumm;

import com.facebook.react.bridge.ReactApplicationContext;
import com.reactnativenavigation.NavigationActivity;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

import androidx.annotation.Nullable;
import com.reactnativenavigation.react.CommandListenerAdapter;

import org.json.JSONException;

import libs.security.authentication.Biometric.BiometricModule;

import libs.security.vault.VaultManagerModule;
import libs.security.vault.cipher.Cipher;
import libs.security.vault.cipher.CipherV1AesCbc;
import libs.security.vault.cipher.CipherV2AesGcm;
import libs.security.vault.exceptions.CryptoFailedException;
import libs.security.vault.storage.Keychain;

import java.util.Locale;
import java.util.Map;

public class MainActivity extends NavigationActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // check only one root activity is running at the time
        if (!isTaskRoot()) {
            finish();
            return;
        }


        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {

//                try {
//                    ReactApplicationContext reactContext = (ReactApplicationContext)((MainApplication)getApplication()).getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
//                    Keychain keychain = new Keychain(reactContext);
//
//
//
//                        keychain.setItem("test_alias2", "username_content", "password_content");
//
//
//                    keychain.getItem("test_alias2");
//
//                } catch (Exception exception) {
//                    exception.printStackTrace();
//                }
            }
        }, 3000);

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
