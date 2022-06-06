package com.xrpllabs.xumm;

import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientProvider;

// Local Libs
import libs.crypto.modules.CryptoPackage;
import libs.authentication.Biometric.BiometricPackage;
import libs.ui.KeyboardPackage;
import libs.ui.ActionSheetPackage;
import libs.ui.PromptPackage;
import libs.ui.QRCodePackage;
import libs.ui.DimensionPackage;
import libs.notification.LocalNotificationPackage;
import libs.common.SharedPreferencesPackage;
import libs.common.AppUpdatePackage;
import libs.common.InAppPurchasePackage;
import libs.common.HTTPClientFactory;
import libs.utils.UtilsPackage;

// External Dependencies
import com.google.android.gms.common.GoogleApiAvailability;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

// PlayService
import android.content.Intent;

import com.google.android.gms.security.ProviderInstaller;
import com.google.android.gms.security.ProviderInstaller.ProviderInstallListener;

import java.util.List;

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
                    packages.add(new DimensionPackage());
                    packages.add(new BiometricPackage());
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
}


