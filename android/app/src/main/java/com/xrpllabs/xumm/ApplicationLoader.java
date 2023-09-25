package com.xrpllabs.xumm;

import android.content.Intent;
import android.content.Context;

import com.google.android.gms.security.ProviderInstaller;
import com.google.android.gms.security.ProviderInstaller.ProviderInstallListener;

import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientProvider;

// External Dependencies
import com.google.android.gms.common.GoogleApiAvailability;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

// Local Libs
import libs.security.SecurityPackage;
import libs.notification.LocalNotificationPackage;
import libs.common.CommonPackage;
import libs.common.HTTPClientFactory;
import libs.webview.WebViewPackage;
import libs.utils.UtilsPackage;
import libs.ui.UIPackage;

import java.util.List;

public class ApplicationLoader extends NavigationApplication {
    private static ApplicationLoader applicationLoaderInstance;
    public static volatile Context applicationContext;

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
                    packages.add(new UIPackage());
                    packages.add(new LocalNotificationPackage());
                    packages.add(new CommonPackage());
                    packages.add(new SecurityPackage());
                    packages.add(new WebViewPackage());
                    return packages;
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        // cache crated instance
        applicationLoaderInstance = this;
        // cache application context
        try {
            applicationContext = getApplicationContext();
        } catch (Throwable ignore) {

        }
        // super
        super.onCreate();

        // try again
        if (applicationContext == null) {
            applicationContext = getApplicationContext();
        }

        // update security provider
        upgradeSecurityProvider();
        // replace default http client
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
                GoogleApiAvailability.getInstance().showErrorNotification(ApplicationLoader.this, errorCode);
            }
        });
    }
}


