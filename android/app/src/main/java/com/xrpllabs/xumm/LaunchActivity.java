package com.xrpllabs.xumm;

import com.reactnativenavigation.NavigationActivity;

import android.app.ActivityManager;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;

import androidx.annotation.Nullable;
import com.reactnativenavigation.react.CommandListenerAdapter;

import libs.security.authentication.Biometric.BiometricModule;

import java.util.Locale;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowInsetsControllerCompat;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.ViewGroup;
import android.view.Window;

import androidx.coordinatorlayout.widget.CoordinatorLayout;

import java.lang.ref.WeakReference;

public class LaunchActivity extends NavigationActivity {

    private static WeakReference<LaunchActivity> currentLaunch;

    private View splashView;
    private boolean splashHidden = false;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        System.setProperty("java.net.preferIPv4Stack", "true");
        System.setProperty("java.net.preferIPv6Addresses", "false");

        finishOtherXamanTasks();
        if (!isTaskRoot()) {
            finish();
            return;
        }

        currentLaunch = new WeakReference<>(this);

        // initialise required modules
        BiometricModule.initialise();

        // set splash screen
        setSplashLayout();
    }

    @Override
    public void onPostCreate(@Nullable Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        keepSplashInFront();
    }

    @Override
    protected void onDestroy() {
        if (currentLaunch != null && currentLaunch.get() == this) {
            currentLaunch.clear();
        }
        super.onDestroy();
    }

    public static void hideLaunchSplashIfPresent() {
        LaunchActivity activity = currentLaunch != null ? currentLaunch.get() : null;
        if (activity == null || activity.isFinishing()) {
            return;
        }
        activity.runOnUiThread(activity::hideLaunchSplash);
    }

    /**
     * Drop the boot image only after the first React Native screen has painted.
     * RNN setRoot removes content child 0; a dummy view absorbs that so this
     * layout can stay in front until JS calls hide.
     */
    public void hideLaunchSplash() {
        if (splashHidden) {
            return;
        }
        splashHidden = true;
        if (splashView != null) {
            ViewGroup parent = splashView.getParent() instanceof ViewGroup
                    ? (ViewGroup) splashView.getParent()
                    : null;
            splashView.setVisibility(View.GONE);
            if (parent != null) {
                parent.removeView(splashView);
            }
            splashView = null;
        }
        applyNavigatorNavInset();
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        navigator.handleBack(new CommandListenerAdapter());
    }

    /**
     * Keep one recents entry. Empty taskAffinity plus a NEW_TASK start used
     * to open a second Xaman next to the existing one.
     */
    private void finishOtherXamanTasks() {
        ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (manager == null) {
            return;
        }
        int current = getTaskId();
        for (ActivityManager.AppTask task : manager.getAppTasks()) {
            ActivityManager.RecentTaskInfo info = task.getTaskInfo();
            if (info == null) {
                continue;
            }
            int otherId = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? info.taskId : info.id;
            if (otherId != current) {
                task.finishAndRemoveTask();
            }
        }
    }

    private void setSplashLayout() {
        Window window = getWindow();
        // Draw behind system bars. Do not margin the content view: that letterbox
        // shows the window background (black) above and below the app.
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }
        WindowInsetsControllerCompat bars =
                new WindowInsetsControllerCompat(window, window.getDecorView());
        bars.setAppearanceLightStatusBars(false);
        bars.setAppearanceLightNavigationBars(false);

        seedInsetsFromResources();
        setContentView(R.layout.activity_splash);
        ViewGroup content = findViewById(android.R.id.content);
        splashView = findViewById(R.id.splash_root);
        if (splashView != null) {
            splashView.setElevation(1000f);
            splashView.setTranslationZ(1000f);
            // RNN setRoot removes content child 0. Keep a dummy there so the
            // real splash is not deleted before the first screen paints.
            View dummy = new View(this);
            dummy.setVisibility(View.GONE);
            content.addView(dummy, 0);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ keeps a solid-color system splash. Remove it so the
            // pattern + logo layout can show while React Native loads.
            getSplashScreen().setOnExitAnimationListener(splash -> splash.remove());
        }

        View rootView = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (view, insets) -> {
            Insets navigationBars = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
            Insets displayCutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            SafeAreaInsets.setInsets(
                    topContentInsetPx(),
                    overlayNavInsetPx(view),
                    navigationBars.left,
                    navigationBars.right,
                    displayCutout.top
            );
            keepSplashInFront();
            applyNavigatorNavInset();
            return insets;
        });
        ViewCompat.requestApplyInsets(rootView);
        rootView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            keepSplashInFront();
            applyNavigatorNavInset();
        });
    }

    private void keepSplashInFront() {
        if (splashHidden || splashView == null) {
            return;
        }
        ViewGroup parent = splashView.getParent() instanceof ViewGroup
                ? (ViewGroup) splashView.getParent()
                : null;
        if (parent == null) {
            return;
        }
        if (parent.getChildAt(parent.getChildCount() - 1) != splashView) {
            splashView.bringToFront();
        }
        splashView.setVisibility(View.VISIBLE);
    }

    /**
     * RNN ignores navigation-bar insets on API 35+. Pad the navigator root so
     * screens sit above overlay nav (gesture pill). Classic 3-button bars already
     * sit outside the app on older APIs — extra pad there made a gap.
     * Keep navigator layers clear until React Native has painted, or a white
     * page covers the boot image.
     *
     * RNN stacks three CoordinatorLayouts in content: root, modals, overlays.
     * Only the root should be opaque. Painting overlays/modals hides the
     * screen behind ActionPanel (iOS keeps a dimmed scrim).
     */
    private void applyNavigatorNavInset() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) {
            return;
        }
        int bottom = overlayNavInsetPx(content);
        int background = resolveNavigatorBackgroundColor();
        boolean paintedRoot = false;
        boolean sawRoot = false;
        for (int i = 0; i < content.getChildCount(); i++) {
            View child = content.getChildAt(i);
            if (!(child instanceof CoordinatorLayout)) {
                continue;
            }
            if (child.getPaddingBottom() != bottom) {
                child.setPadding(child.getPaddingLeft(), child.getPaddingTop(), child.getPaddingRight(), bottom);
            }
            if (!sawRoot) {
                sawRoot = true;
                if (splashHidden && hasLaidOutContent((ViewGroup) child) && background != Color.TRANSPARENT) {
                    paintedRoot = true;
                    child.setBackgroundColor(background);
                } else {
                    child.setBackgroundColor(Color.TRANSPARENT);
                }
            } else {
                child.setBackgroundColor(Color.TRANSPARENT);
            }
        }
        if (paintedRoot) {
            getWindow().setBackgroundDrawable(new ColorDrawable(background));
        }
    }

    private int overlayNavInsetPx(View content) {
        WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(content);
        int nav = 0;
        if (windowInsets != null) {
            nav = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
        }
        if (nav <= 0) {
            nav = SafeAreaInsets.getSafeAreaBottom();
        }
        // 3-button nav on API 34 and older is a solid system bar, not an overlay.
        if (Build.VERSION.SDK_INT < 35 && !usesGestureNavigation()) {
            return 0;
        }
        return nav;
    }

    private boolean usesGestureNavigation() {
        try {
            return Settings.Secure.getInt(getContentResolver(), "navigation_mode", 0) == 2;
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean hasLaidOutContent(ViewGroup coordinator) {
        for (int i = 0; i < coordinator.getChildCount(); i++) {
            View child = coordinator.getChildAt(i);
            if (child.getVisibility() == View.VISIBLE && child.getHeight() > 100) {
                return true;
            }
        }
        return false;
    }

    private int resolveNavigatorBackgroundColor() {
        int tabsId = getResources().getIdentifier("bottomTabs", "id", getPackageName());
        View tabs = tabsId != 0 ? findViewById(tabsId) : null;
        int fromTabs = opaqueColorFrom(tabs);
        if (fromTabs != Color.TRANSPARENT) {
            return fromTabs;
        }
        // Onboarding has no bottomTabs. After splash hide, still paint the
        // nav inset with the OS light/dark color so the blue splash window
        // does not show through. Splash itself stays blue until hidden.
        if (splashHidden) {
            int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
            return night == Configuration.UI_MODE_NIGHT_YES ? Color.BLACK : Color.WHITE;
        }
        return Color.TRANSPARENT;
    }

    private int opaqueColorFrom(View view) {
        if (view == null) {
            return Color.TRANSPARENT;
        }
        Drawable background = view.getBackground();
        if (background instanceof ColorDrawable) {
            int color = ((ColorDrawable) background).getColor();
            if (Color.alpha(color) == 0xFF) {
                return color;
            }
        }
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                int color = opaqueColorFrom(group.getChildAt(i));
                if (color != Color.TRANSPARENT) {
                    return color;
                }
            }
        }
        return Color.TRANSPARENT;
    }

    private void seedInsetsFromResources() {
        int top = topContentInsetPx();
        int bottom = systemDimensionPx("navigation_bar_height");
        if (Build.VERSION.SDK_INT < 35 && !usesGestureNavigation()) {
            bottom = 0;
        }
        SafeAreaInsets.setInsets(top, bottom, 0, 0, top);
    }

    /**
     * Punch-hole devices inflate status_bar_height / statusBars.top to the
     * camera cutout (~52dp). Clock and wifi sit in the classic 24dp icon bar.
     * Pad that bar plus 8dp so titles sit close to the status icons, like iOS.
     */
    private int topContentInsetPx() {
        float density = getResources().getDisplayMetrics().density;
        int classic = Math.round(24f * density);
        int extra = Math.round(8f * density);
        int resource = systemDimensionPx("status_bar_height");
        int iconBar = resource;
        if (iconBar <= 0 || iconBar > classic + extra) {
            iconBar = classic;
        }
        return iconBar + extra;
    }

    private int systemDimensionPx(final String name) {
        int id = getResources().getIdentifier(name, "dimen", "android");
        return id > 0 ? getResources().getDimensionPixelSize(id) : 0;
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
