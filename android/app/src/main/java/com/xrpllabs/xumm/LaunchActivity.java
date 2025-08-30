package com.xrpllabs.xumm;

import com.reactnativenavigation.NavigationActivity;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import com.reactnativenavigation.react.CommandListenerAdapter;

import libs.security.authentication.Biometric.BiometricModule;

import java.util.Locale;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import android.view.ViewGroup;

import android.graphics.Color;
import android.view.WindowManager;
import androidx.core.view.WindowInsetsControllerCompat;

public class LaunchActivity extends NavigationActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        System.setProperty("java.net.preferIPv4Stack", "true");
        System.setProperty("java.net.preferIPv6Addresses", "false");

        // check only one root activity is running at the time
        if (!isTaskRoot()) {
            finish();
            return;
        }

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
        // Force transparent backgrounds
        // getWindow().setStatusBarColor(Color.TRANSPARENT);
        // getWindow().setNavigationBarColor(Color.TRANSPARENT);
        // getWindow().getDecorView().setBackgroundColor(Color.TRANSPARENT);
        
        // Add flags for translucent bars
        // getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        // getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        setContentView(R.layout.activity_splash);

        View rootView = findViewById(android.R.id.content);

        ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, insets) -> {
            // Get different types of insets separately
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            Insets navigationBars = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
            Insets statusBars = insets.getInsets(WindowInsetsCompat.Type.statusBars());
            Insets displayCutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            
            // Check if device has virtual navigation buttons
            boolean hasVirtualNavigation = navigationBars.bottom > 0 || 
                                        navigationBars.left > 0 || 
                                        navigationBars.right > 0;
            
            // Check if device has status bar
            boolean hasStatusBar = statusBars.top > 0;
            
            // Store these values for use throughout your app
            SafeAreaInsets.setInsets(
                statusBars.top,           // 159px
                navigationBars.bottom,    // 72px  
                navigationBars.left,      // 0px
                navigationBars.right,     // 0px
                displayCutout.top         // 159px
            );
        
            // Log for debugging
            android.util.Log.d("EdgeToEdge", "Status bar top: " + statusBars.top);
            android.util.Log.d("EdgeToEdge", "Navigation bottom: " + navigationBars.bottom);
            android.util.Log.d("EdgeToEdge", "Navigation left: " + navigationBars.left);
            android.util.Log.d("EdgeToEdge", "Navigation right: " + navigationBars.right);
            android.util.Log.d("EdgeToEdge", "Has virtual nav: " + hasVirtualNavigation);
            android.util.Log.d("EdgeToEdge", "Display cutout: " + displayCutout.top);
            
            // For true edge-to-edge, don't apply any margins
            // Your content will draw behind system UI
            
            // Optional: Apply padding only for critical UI elements that need to avoid system UI
            // You can do this selectively in your layout or fragments

            ViewGroup.MarginLayoutParams layoutParams = 
                (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            layoutParams.setMargins(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            );
            view.setLayoutParams(layoutParams);
            
            // return WindowInsetsCompat.CONSUMED;
            
            return insets; // Return original insets, don't consume them
        });

        // ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, insets) -> {
        //     Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            
        //     // Use margins instead of padding to avoid touch misalignment
        //     ViewGroup.MarginLayoutParams layoutParams = 
        //         (ViewGroup.MarginLayoutParams) view.getLayoutParams();
        //     layoutParams.setMargins(
        //         systemBars.left,
        //         systemBars.top,
        //         systemBars.right,
        //         systemBars.bottom
        //     );
        //     view.setLayoutParams(layoutParams);
            
        //     return WindowInsetsCompat.CONSUMED;
        // });
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
