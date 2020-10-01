package libs.common;

import com.xrpllabs.xumm.R;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.View;
import android.view.ViewGroup;
import android.os.Build;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import com.google.android.material.snackbar.Snackbar;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.InstallState;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.play.core.install.model.ActivityResult;

import com.google.android.play.core.tasks.Task;

public class AppUpdateModule extends ReactContextBaseJavaModule implements InstallStateUpdatedListener, LifecycleEventListener {

    private static ReactApplicationContext reactContext;

    private AppUpdateManager appUpdateManager;
    private AppUpdateInfo appUpdateInfo;

    private static final int UPDATE_REQUEST = 0;
    private static final String E_FAILED_TO_UPDATE = "E_FAILED_TO_UPDATE";
    private static final String E_UPDATE_CANCELLED = "E_UPDATE_CANCELLED";

    private Promise updatePromise;


    AppUpdateModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        reactContext.addActivityEventListener(mActivityEventListener);
        reactContext.addLifecycleEventListener(this);


        appUpdateManager = AppUpdateManagerFactory.create(reactContext);
        appUpdateManager.registerListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "AppUpdateModule";
    }


    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == UPDATE_REQUEST) {
                if (updatePromise != null) {
                    if (resultCode == Activity.RESULT_CANCELED) {
                        updatePromise.reject(E_UPDATE_CANCELLED, "app update canceled");
                        updatePromise = null;
                    } else if (resultCode == ActivityResult.RESULT_IN_APP_UPDATE_FAILED) {
                        updatePromise.reject(E_FAILED_TO_UPDATE, "app download failed");
                    } else {
                        updatePromise.resolve(true);
                    }

                    updatePromise = null;
                }
            }
        }
    };


    @ReactMethod
    public void checkUpdate(Promise promise) {
        try {
            Task<AppUpdateInfo> appUpdateInfoTask = appUpdateManager.getAppUpdateInfo();
            appUpdateInfoTask.addOnSuccessListener(result -> {
                // set app update info
                appUpdateInfo = result;

                if (result.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                    promise.resolve(result.availableVersionCode());
                } else {
                    promise.resolve(false);
                }
            });
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void startUpdate(Promise promise) {
        // set promise for resolve
        updatePromise = promise;

        if (appUpdateManager != null && appUpdateInfo != null) {
            try {
                appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        AppUpdateType.FLEXIBLE,
                        reactContext.getCurrentActivity(),
                        UPDATE_REQUEST);
            } catch (IntentSender.SendIntentException e) {
                e.printStackTrace();
            }
        } else {
            promise.reject("error", "checkUpdate method should be called first");
        }
    }


    @Override
    public void onStateUpdate(InstallState state) {
        if (state.installStatus() == InstallStatus.DOWNLOADED) {
            popupSnackbarForCompleteUpdate();
        }
    }

    private void popupSnackbarForCompleteUpdate() {
        ViewGroup decorView;

        try {
            decorView = (ViewGroup) reactContext.getCurrentActivity().getWindow().getDecorView().findViewById(android.R.id.content);
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }


        Snackbar snackbar = Snackbar.make(decorView, "Update complete",
                Snackbar.LENGTH_INDEFINITE);


        View snackBarView = snackbar.getView();


        Typeface font = Typeface.createFromAsset(decorView.getContext().getAssets(), "fonts/Proxima Nova Regular.otf");
        Typeface fontBold = Typeface.createFromAsset(decorView.getContext().getAssets(), "fonts/Proxima Nova Bold.otf");

        // title
        TextView snackbarText = snackBarView.findViewById(com.google.android.material.R.id.snackbar_text);
        snackbarText.setTextColor(Color.WHITE);
        snackbarText.setTypeface(font);
        snackbarText.setMaxLines(2);


        // action
        TextView snackbarActionText = snackBarView.findViewById(com.google.android.material.R.id.snackbar_action);
        snackbarActionText.setTextColor(Color.WHITE);
        snackbarActionText.setTypeface(fontBold);
        snackbarActionText.setPadding(0, 0, 100, 0);


        // shadow
        snackBarView.setElevation(9f);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            snackbar.getView().setBackground(reactContext.getDrawable(R.drawable.contianer_snackbar));
        }

        snackbar.setAction("RESTART", view -> appUpdateManager.completeUpdate());
        snackbar.show();
    }

    @Override
    public void onHostResume() {
        if (appUpdateManager != null) {
            appUpdateManager
                    .getAppUpdateInfo()
                    .addOnSuccessListener(
                            appUpdateInfo -> {
                                if (appUpdateInfo.installStatus() == InstallStatus.DOWNLOADED) {
                                    popupSnackbarForCompleteUpdate();
                                }
                                if (appUpdateInfo.updateAvailability()
                                        == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                                    try {
                                        appUpdateManager.startUpdateFlowForResult(
                                                appUpdateInfo,
                                                AppUpdateType.IMMEDIATE,
                                                reactContext.getCurrentActivity(),
                                                UPDATE_REQUEST);
                                    } catch (IntentSender.SendIntentException e) {
                                        e.printStackTrace();
                                    }
                                }

                            });
        }
    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {
        if (appUpdateManager != null) {
            appUpdateManager.unregisterListener(this);
        }
    }
}