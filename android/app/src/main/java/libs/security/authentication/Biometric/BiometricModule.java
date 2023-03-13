package libs.security.authentication.Biometric;

import androidx.annotation.NonNull;

import androidx.biometric.BiometricPrompt;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt.PromptInfo;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.UiThreadUtil;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;


@ReactModule(name = BiometricModule.NAME)
public class BiometricModule extends ReactContextBaseJavaModule {
    // constants
    public static final String TYPE_BIOMETRICS = "Biometrics";
    // errors
    public static final String ERROR_USER_CANCEL = "USER_CANCEL";
    public static final String ERROR_NOT_SUPPORTED = "BIOMETRIC_NOT_SUPPORTED";
    public static final String ERROR_NOT_ENROLLED = "NOT_ENROLLED";
    public static final String ERROR_NOT_AVAILABLE = "NOT_AVAILABLE";
    public static final String ERROR_BIOMETRIC = "BIOMETRIC_ERROR";
    public static final String ERROR_NOT_MEET_SECURITY_REQUIREMENTS = "NOT_MEET_SECURITY_REQUIREMENTS";
    public static final String ERROR_BIOMETRIC_HAS_BEEN_CHANGED = "BIOMETRIC_HAS_BEEN_CHANGED";
    public static final String ERROR_UNABLE_REFRESH_AUTHENTICATION_KEY = "UNABLE_REFRESH_AUTHENTICATION_KEY";

    private static BiometricPrompt biometricPrompt;
    private final ReactApplicationContext mReactContext;

    public BiometricModule(ReactApplicationContext reactContext) {
        super(reactContext);

        mReactContext = reactContext;
    }

    static final String NAME = "BiometricModule";

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }


    public static void initialise() {
        // generate key if no key is exist
        if (!SecurityProvider.isKeyReady()) {
            SecurityProvider.generateKey();
        }
    }

    public class AuthCallback extends BiometricPrompt.AuthenticationCallback {
        private Promise promise;

        public AuthCallback(final Promise promise) {
            super();
            this.promise = promise;
        }

        @Override
        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
            super.onAuthenticationError(errorCode, errString);
            promise.reject(getBiometricError(errorCode), TYPE_BIOMETRICS);
        }

        @Override
        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
            super.onAuthenticationSucceeded(result);
            promise.resolve(TYPE_BIOMETRICS);
        }

        @Override
        public void onAuthenticationFailed() {
            super.onAuthenticationFailed();
        }
    }

    private void biometricAuthenticate(final String reason, final Promise promise) {
        UiThreadUtil.runOnUiThread(
                new Runnable() {
                    @Override
                    public void run() {
                        FragmentActivity fragmentActivity = (FragmentActivity) mReactContext.getCurrentActivity();

                        if (fragmentActivity == null) return;

                        AuthCallback authCallback = new AuthCallback(promise);

                        Executor executor = Executors.newSingleThreadExecutor();
                        biometricPrompt = new BiometricPrompt(
                                fragmentActivity,
                                executor,
                                authCallback
                        );

                        PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                                .setConfirmationRequired(false)
                                .setNegativeButtonText("Cancel")
                                .setTitle(reason)
                                .build();

                        biometricPrompt.authenticate(promptInfo);
                    }
                });

    }

    public static String getBiometricError(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_USER_CANCELED:
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return ERROR_USER_CANCEL;
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return ERROR_NOT_SUPPORTED;
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return ERROR_NOT_AVAILABLE;
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return ERROR_NOT_ENROLLED;
            default:
                return ERROR_BIOMETRIC;
        }
    }

    private String getSensorErrors() {
        BiometricManager biometricManager = BiometricManager.from(mReactContext);
        int authResult = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);

        // can authorize with biometrics
        if (authResult == BiometricManager.BIOMETRIC_SUCCESS) {
            // if sensor is available but the key is not generated
            // or KeyguardSecure is not available return error
            if (!SecurityProvider.isKeyReady() || !SecurityProvider.isKeyguardSecure(mReactContext)) {
                return ERROR_NOT_MEET_SECURITY_REQUIREMENTS;
            }

            // everything seems fine
            return null;
        } else {
            if (authResult == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
                return ERROR_NOT_SUPPORTED;
            } else if (authResult == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
                return ERROR_NOT_ENROLLED;
            } else if (authResult == BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE) {
                return ERROR_NOT_AVAILABLE;
            }
            return ERROR_BIOMETRIC;
        }
    }

    @ReactMethod
    public void authenticate(String reason, final Promise promise) {
        // check for any error before starting authentication
        String error = getSensorErrors();

        // there is an error
        if (error != null) {
            promise.reject(error, "");
            return;
        }

        // before authentication check for finger print change
        // we can do this before authentication but for consonant with iOS we check after auth
        if (SecurityProvider.checkDeviceBiometricChanged()) {
            promise.reject(ERROR_BIOMETRIC_HAS_BEEN_CHANGED, TYPE_BIOMETRICS);
            return;
        }

        // start authentication process
        biometricAuthenticate(reason, promise);
    }

    @ReactMethod
    public void isSensorAvailable(final Promise promise) {
        String error = getSensorErrors();

        // there is error
        if (error != null) {
            promise.reject(error, "");
        } else {
            // can authorize
            promise.resolve(TYPE_BIOMETRICS);
        }
    }

    @ReactMethod
    public void refreshAuthenticationKey(final Promise promise) {
        // remove old invalidated key
        SecurityProvider.deleteInvalidKey();

        // generate new key
        SecurityProvider.generateKey();

        // check if new key is ready
        if (SecurityProvider.isKeyReady()) {
            promise.resolve(true);
            return;
        }
        promise.reject(ERROR_UNABLE_REFRESH_AUTHENTICATION_KEY, "");
    }
}
