package com.xrpllabs.xumm;

import android.content.Context;

import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.network.OkHttpClientProvider;

// Local Libs
import libs.utils.UtilsPackage;
import libs.ui.KeyboardPackage;
import libs.crypto.modules.CryptoPackage;
import libs.ui.ActionSheetPackage;
import libs.ui.PromptPackage;
import libs.ui.QRCodePackage;
import libs.notification.LocalNotificationPackage;
import libs.common.SharedPreferencesPackage;
import libs.common.AppUpdatePackage;
import libs.common.InAppPurchasePackage;
import libs.common.HTTPClientFactory;

// External Dependencies
import com.google.android.gms.common.GoogleApiAvailability;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

// PlayService
import android.content.Intent;
import com.google.android.gms.security.ProviderInstaller;
import com.google.android.gms.security.ProviderInstaller.ProviderInstallListener;

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
                @SuppressWarnings("UnnecessaryLocalVariable")
                List<ReactPackage> packages = new PackageList(this).getPackages();
                // Local Libs
                packages.add(new UtilsPackage());
                packages.add(new KeyboardPackage());
                packages.add(new CryptoPackage());
                packages.add(new ActionSheetPackage());
                packages.add(new PromptPackage());
                packages.add(new QRCodePackage());
                packages.add(new SharedPreferencesPackage());
                packages.add(new LocalNotificationPackage());
                packages.add(new AppUpdatePackage());
                packages.add(new InAppPurchasePackage());
                return packages;
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
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
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
                GoogleApiAvailability.getInstance().showErrorNotification(MainApplication.this, errorCode);
            }
        });
    }

    /**
    * Loads Flipper in React Native templates. Call this in the onCreate method with something like
    * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    *
    * @param context
    * @param reactInstanceManager
    */
    private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
                /*
                We use reflection here to pick up the class that initializes Flipper,
                since Flipper library is not available in release mode
                */
                Class<?> aClass = Class.forName("com.xrpllabs.xumm.ReactNativeFlipper");
                aClass
                    .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                    .invoke(null, context, reactInstanceManager);
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


