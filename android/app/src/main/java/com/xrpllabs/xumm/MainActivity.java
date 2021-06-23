package com.xrpllabs.xumm;

import com.reactnativenavigation.NavigationActivity;

import android.os.Bundle;

import androidx.annotation.Nullable;
import com.reactnativenavigation.react.CommandListenerAdapter;

public class MainActivity extends NavigationActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // check only one root activity is running at the time
        if (!isTaskRoot()) {
            finish();
            return;
        }

        setSplashLayout();
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        navigator.handleBack(new CommandListenerAdapter());
    }

    private void setSplashLayout() {
        setContentView(R.layout.activity_splash);
    }
}