package libs.ui;


import android.app.Activity;
import android.content.DialogInterface;
import android.os.Bundle;

import androidx.fragment.app.FragmentActivity;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.dialog.DialogModule;

import java.util.Map;

import javax.annotation.Nullable;

@ReactModule(name = PromptModule.NAME)
public class PromptModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    static final String FRAGMENT_TAG = "react.prompt.PromptModule";
    static final String ACTION_BUTTON_CLICKED = "buttonClicked";
    static final String ACTION_DISMISSED = "dismissed";
    static final String KEY_TITLE = "title";
    static final String KEY_MESSAGE = "message";
    static final String KEY_BUTTON_POSITIVE = "buttonPositive";
    static final String KEY_BUTTON_NEGATIVE = "buttonNegative";
    static final String KEY_BUTTON_NEUTRAL = "buttonNeutral";
    static final String KEY_ITEMS = "items";
    static final String KEY_CANCELABLE = "cancelable";
    static final String KEY_TYPE = "type";
    static final String KEY_USER_INTERFACE_STYLE = "userInterfaceStyle";
    static final String KEY_DEFAULT_VALUE = "defaultValue";
    static final String KEY_PLACEHOLDER = "placeholder";

    static final Map<String, Object> CONSTANTS = MapBuilder.<String, Object>of(
            ACTION_BUTTON_CLICKED, ACTION_BUTTON_CLICKED,
            ACTION_DISMISSED, ACTION_DISMISSED,
            KEY_BUTTON_POSITIVE, DialogInterface.BUTTON_POSITIVE,
            KEY_BUTTON_NEGATIVE, DialogInterface.BUTTON_NEGATIVE,
            KEY_BUTTON_NEUTRAL, DialogInterface.BUTTON_NEUTRAL);
    static final String NAME = "PromptAndroid";
    private boolean mIsInForeground;

    public PromptModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void initialize() {
        getReactApplicationContext().addLifecycleEventListener(this);
    }

    @Override
    public void onHostPause() {
        // Don't show the dialog if the host is paused.
        mIsInForeground = false;
    }

    @Override
    public void onHostDestroy() {
    }

    @Override
    public void onHostResume() {
        mIsInForeground = true;
        // Check if a dialog has been created while the host was paused, so that we can show it now.
        FragmentManagerHelper fragmentManagerHelper = getFragmentManagerHelper();
        if (fragmentManagerHelper != null) {
            fragmentManagerHelper.showPendingAlert();
        } else {
            FLog.w(DialogModule.class, "onHostResume called but no FragmentManager found");
        }
    }


    @ReactMethod
    public void promptWithArgs(ReadableMap options, final Callback callback) {
        final FragmentManagerHelper fragmentManagerHelper = getFragmentManagerHelper();
        if (fragmentManagerHelper == null) {
            FLog.w(PromptModule.class, "Tried to show an alert while not attached to an Activity");
            return;
        }

        final Bundle args = new Bundle();
        if (options.hasKey(KEY_TITLE)) {
            args.putString(PromptFragment.ARG_TITLE, options.getString(KEY_TITLE));
        }
        if (options.hasKey(KEY_MESSAGE)) {
            String message = options.getString(KEY_MESSAGE);
            if (!message.isEmpty()) {
                args.putString(PromptFragment.ARG_MESSAGE, options.getString(KEY_MESSAGE));
            }
        }
        if (options.hasKey(KEY_BUTTON_POSITIVE)) {
            args.putString(PromptFragment.ARG_BUTTON_POSITIVE, options.getString(KEY_BUTTON_POSITIVE));
        }
        if (options.hasKey(KEY_BUTTON_NEGATIVE)) {
            args.putString(PromptFragment.ARG_BUTTON_NEGATIVE, options.getString(KEY_BUTTON_NEGATIVE));
        }
        if (options.hasKey(KEY_BUTTON_NEUTRAL)) {
            args.putString(PromptFragment.ARG_BUTTON_NEUTRAL, options.getString(KEY_BUTTON_NEUTRAL));
        }
        if (options.hasKey(KEY_ITEMS)) {
            ReadableArray items = options.getArray(KEY_ITEMS);
            CharSequence[] itemsArray = new CharSequence[items.size()];
            for (int i = 0; i < items.size(); i++) {
                itemsArray[i] = items.getString(i);
            }
            args.putCharSequenceArray(PromptFragment.ARG_ITEMS, itemsArray);
        }
        if (options.hasKey(KEY_CANCELABLE)) {
            args.putBoolean(KEY_CANCELABLE, options.getBoolean(KEY_CANCELABLE));
        }
        if (options.hasKey(KEY_TYPE)) {
            args.putString(KEY_TYPE, options.getString(KEY_TYPE));
        }
        if (options.hasKey(KEY_USER_INTERFACE_STYLE)) {
            args.putString(KEY_USER_INTERFACE_STYLE, options.getString(KEY_USER_INTERFACE_STYLE));
        }
        if (options.hasKey(KEY_DEFAULT_VALUE)) {
            args.putString(KEY_DEFAULT_VALUE, options.getString(KEY_DEFAULT_VALUE));
        }
        if (options.hasKey(KEY_PLACEHOLDER)) {
            args.putString(KEY_PLACEHOLDER, options.getString(KEY_PLACEHOLDER));
        }
        fragmentManagerHelper.showNewAlert(mIsInForeground, args, callback);
    }

    @Override
    public Map<String, Object> getConstants() {
        return CONSTANTS;
    }

    private
    @Nullable
    FragmentManagerHelper getFragmentManagerHelper() {
        Activity activity = getCurrentActivity();
        if (activity == null || !(activity instanceof FragmentActivity)) {
            return null;
        }
        return new FragmentManagerHelper(((FragmentActivity) activity).getSupportFragmentManager());
    }

    private class FragmentManagerHelper {

        // Exactly one of the two is null
        private final
        @Nullable
        androidx.fragment.app.FragmentManager mFragmentManager;

        private
        @Nullable
        PromptFragment mFragmentToShow;


        public FragmentManagerHelper(androidx.fragment.app.FragmentManager fragmentManager) {
            mFragmentManager = fragmentManager;
        }

        public void showPendingAlert() {
            if (mFragmentToShow == null) {
                return;
            }
            mFragmentToShow.show(mFragmentManager, FRAGMENT_TAG);
            mFragmentToShow = null;
        }

        private void dismissExisting() {
            if (mFragmentManager != null) {
                PromptFragment oldFragment =
                        (PromptFragment) mFragmentManager.findFragmentByTag(FRAGMENT_TAG);
                if (oldFragment != null) {
                    oldFragment.dismiss();
                }
            }
        }

        public void showNewAlert(boolean isInForeground, Bundle arguments, Callback actionCallback) {
            dismissExisting();

            PromptFragmentListener actionListener =
                    actionCallback != null ? new PromptFragmentListener(actionCallback) : null;

            final PromptFragment promptFragment = new PromptFragment();
            promptFragment.setListener(actionListener);
            promptFragment.setArguments(arguments);

            if (isInForeground) {
                if (arguments.containsKey(KEY_CANCELABLE)) {
                    promptFragment.setCancelable(arguments.getBoolean(KEY_CANCELABLE));
                }
                promptFragment.show(mFragmentManager, FRAGMENT_TAG);
            } else {
                mFragmentToShow = promptFragment;
            }
        }
    }

    class PromptFragmentListener implements DialogInterface.OnClickListener, DialogInterface.OnDismissListener {

        private final Callback mCallback;
        private boolean mCallbackConsumed = false;

        public PromptFragmentListener(Callback callback) {
            mCallback = callback;
        }

        @Override
        public void onClick(DialogInterface dialog, int which) {
            onConfirm(which, "");
        }

        public void onConfirm(int which, String input) {
            if (!mCallbackConsumed) {
                if (getReactApplicationContext().hasActiveReactInstance()) {
                    mCallback.invoke(ACTION_BUTTON_CLICKED, which, input);
                    mCallbackConsumed = true;
                }
            }
        }

        @Override
        public void onDismiss(DialogInterface dialog) {
            if (!mCallbackConsumed) {
                if (getReactApplicationContext().hasActiveReactInstance()) {
                    mCallback.invoke(ACTION_DISMISSED);
                    mCallbackConsumed = true;
                }
            }
        }
    }
}
