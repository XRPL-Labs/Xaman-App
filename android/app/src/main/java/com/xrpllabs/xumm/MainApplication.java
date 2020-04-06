package com.xrpllabs.xumm;

import android.content.Context;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.modules.network.OkHttpClientProvider;

// Local Libs
import libs.utils.UtilsPackage;
import libs.crypto.CryptoPackage;
import libs.ui.ActionSheetPackage;
import libs.ui.PromptPackage;
import libs.ui.QRCodePackage;

import libs.common.HTTPClientFactory;

// firebase
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;

// External Dependencies
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationPackage;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.oblador.keychain.KeychainPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.hieuvp.fingerprint.ReactNativeFingerprintScannerPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.wix.interactable.Interactable;
import com.cmcewen.blurview.BlurViewPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import io.realm.react.RealmReactPackage;
import org.reactnative.camera.RNCameraPackage;
import cl.json.RNSharePackage;

// PlayService
import android.content.Intent;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.security.ProviderInstaller;
import com.google.android.gms.security.ProviderInstaller.ProviderInstallListener;

import java.util.Arrays;
import java.util.List;
import java.lang.reflect.InvocationTargetException;

public class MainApplication extends NavigationApplication {
    private final ReactNativeHost mReactNativeHost =
        new NavigationReactNativeHost(this) {
            @Override
            protected String getJSMainModuleName() {
                return "index";
            }

            @Override
            public boolean getUseDeveloperSupport() {
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
                    new NavigationPackage(mReactNativeHost),
                    // Local Libs
                    new UtilsPackage(),
                    new CryptoPackage(),
                    new ActionSheetPackage(),
                    new PromptPackage(),
                    new QRCodePackage(),
                    // Firebase Dependencies
                    new RNFirebasePackage(),
                    new RNFirebaseMessagingPackage(),
                    new RNFirebaseNotificationsPackage(),
                    new RNFirebaseCrashlyticsPackage(),
                    new RNFirebaseAnalyticsPackage(),
                    // Other Dependencies
                    new KeychainPackage(),
                    new RNDeviceInfo(),
                    new ReactNativeFingerprintScannerPackage(),
                    new NetInfoPackage(),
                    new Interactable(),
                    new RealmReactPackage(),
                    new RNCameraPackage(),
                    new RNSharePackage(),
                    new BlurViewPackage(),
                    new RNCWebViewPackage()
                );
            }
        };


    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Update security provider
        upgradeSecurityProvider();

        // Replace default http client
        OkHttpClientProvider.setOkHttpClientFactory(new HTTPClientFactory());

        // initialize flipper
        initializeFlipper(this);
    }


    /**
     * Update Security providers
     */
    private void upgradeSecurityProvider() {
        ProviderInstaller.installIfNeededAsync(this, new ProviderInstallListener() {
        @Override
        public void onProviderInstalled() {
        }

        @Override
        public void onProviderInstallFailed(int errorCode, Intent recoveryIntent) {
            GooglePlayServicesUtil.showErrorNotification(errorCode, MainApplication.this);
        }
        });
    }


    /**
     * Loads Flipper in React Native templates.
     *
     * @param context
     */
    private static void initializeFlipper(Context context) {
        if (BuildConfig.DEBUG) {
            try {
                /*
                We use reflection here to pick up the class that initializes Flipper,
                since Flipper library is not available in release mode
                */
                Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
                aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

}


