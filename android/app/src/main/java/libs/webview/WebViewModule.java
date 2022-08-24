package libs.webview;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Parcelable;
import android.provider.MediaStore;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.core.util.Pair;

import android.util.Log;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicReference;

import static android.app.Activity.RESULT_OK;

@ReactModule(name = WebViewModule.MODULE_NAME)
public class WebViewModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    public static final String MODULE_NAME = "RNCWebView";
    private static final int PICKER = 1;
    private static final int PICKER_LEGACY = 3;
    private ValueCallback<Uri> filePathCallbackLegacy;
    private ValueCallback<Uri[]> filePathCallback;
    private File outputImage;
    private File outputVideo;

    protected static class ShouldOverrideUrlLoadingLock {
        protected enum ShouldOverrideCallbackState {
            UNDECIDED,
            SHOULD_OVERRIDE,
            DO_NOT_OVERRIDE,
        }

        private int nextLockIdentifier = 1;
        private final HashMap<Integer, AtomicReference<ShouldOverrideCallbackState>> shouldOverrideLocks = new HashMap<>();

        public synchronized Pair<Integer, AtomicReference<ShouldOverrideCallbackState>> getNewLock() {
            final int lockIdentifier = nextLockIdentifier++;
            final AtomicReference<ShouldOverrideCallbackState> shouldOverride = new AtomicReference<>(ShouldOverrideCallbackState.UNDECIDED);
            shouldOverrideLocks.put(lockIdentifier, shouldOverride);
            return new Pair<>(lockIdentifier, shouldOverride);
        }

        @Nullable
        public synchronized AtomicReference<ShouldOverrideCallbackState> getLock(Integer lockIdentifier) {
            return shouldOverrideLocks.get(lockIdentifier);
        }

        public synchronized void removeLock(Integer lockIdentifier) {
            shouldOverrideLocks.remove(lockIdentifier);
        }
    }

    protected static final ShouldOverrideUrlLoadingLock shouldOverrideUrlLoadingLock = new ShouldOverrideUrlLoadingLock();

    private enum MimeType {
        DEFAULT("*/*"),
        IMAGE("image"),
        VIDEO("video");

        private final String value;

        MimeType(String value) {
            this.value = value;
        }
    }

    public WebViewModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void isFileUploadSupported(final Promise promise) {
        Boolean result = false;
        int current = Build.VERSION.SDK_INT;
        if (current >= Build.VERSION_CODES.LOLLIPOP) {
            result = true;
        }
        if (current >= Build.VERSION_CODES.JELLY_BEAN && current <= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            result = true;
        }
        promise.resolve(result);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public void onShouldStartLoadWithRequestCallback(final boolean shouldStart, final int lockIdentifier) {
        final AtomicReference<ShouldOverrideUrlLoadingLock.ShouldOverrideCallbackState> lockObject = shouldOverrideUrlLoadingLock.getLock(lockIdentifier);
        if (lockObject != null) {
            synchronized (lockObject) {
                lockObject.set(shouldStart ? ShouldOverrideUrlLoadingLock.ShouldOverrideCallbackState.DO_NOT_OVERRIDE : ShouldOverrideUrlLoadingLock.ShouldOverrideCallbackState.SHOULD_OVERRIDE);
                lockObject.notify();
            }
        }
    }

    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

        if (filePathCallback == null && filePathCallbackLegacy == null) {
            return;
        }

        boolean imageTaken = false;
        boolean videoTaken = false;

        if (outputImage != null && outputImage.length() > 0) {
            imageTaken = true;
        }
        if (outputVideo != null && outputVideo.length() > 0) {
            videoTaken = true;
        }

        // based off of which button was pressed, we get an activity result and a file
        // the camera activity doesn't properly return the filename* (I think?) so we use
        // this filename instead
        switch (requestCode) {
            case PICKER:
                if (resultCode != RESULT_OK) {
                    if (filePathCallback != null) {
                        filePathCallback.onReceiveValue(null);
                    }
                } else {
                    if (imageTaken) {
                        filePathCallback.onReceiveValue(new Uri[]{getOutputUri(outputImage)});
                    } else if (videoTaken) {
                        filePathCallback.onReceiveValue(new Uri[]{getOutputUri(outputVideo)});
                    } else {
                        filePathCallback.onReceiveValue(this.getSelectedFiles(data, resultCode));
                    }
                }
                break;
            case PICKER_LEGACY:
                if (resultCode != RESULT_OK) {
                    filePathCallbackLegacy.onReceiveValue(null);
                } else {
                    if (imageTaken) {
                        filePathCallbackLegacy.onReceiveValue(getOutputUri(outputImage));
                    } else if (videoTaken) {
                        filePathCallbackLegacy.onReceiveValue(getOutputUri(outputVideo));
                    } else {
                        filePathCallbackLegacy.onReceiveValue(data.getData());
                    }
                }
                break;

        }

        if (outputImage != null && !imageTaken) {
            outputImage.delete();
        }
        if (outputVideo != null && !videoTaken) {
            outputVideo.delete();
        }

        filePathCallback = null;
        filePathCallbackLegacy = null;
        outputImage = null;
        outputVideo = null;
    }

    public void onNewIntent(Intent intent) {
    }

    private Uri[] getSelectedFiles(Intent data, int resultCode) {
        if (data == null) {
            return null;
        }

        // we have multiple files selected
        if (data.getClipData() != null) {
            final int numSelectedFiles = data.getClipData().getItemCount();
            Uri[] result = new Uri[numSelectedFiles];
            for (int i = 0; i < numSelectedFiles; i++) {
                result[i] = data.getClipData().getItemAt(i).getUri();
            }
            return result;
        }

        // we have one file selected
        if (data.getData() != null && resultCode == RESULT_OK && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        }

        return null;
    }

    public void startPhotoPickerIntent(ValueCallback<Uri> filePathCallback, String acceptType) {
        filePathCallbackLegacy = filePathCallback;

        Intent fileChooserIntent = getFileChooserIntent(acceptType);
        Intent chooserIntent = Intent.createChooser(fileChooserIntent, "");

        ArrayList<Parcelable> extraIntents = new ArrayList<>();
        if (acceptsImages(acceptType)) {
            Intent photoIntent = getPhotoIntent();
            if (photoIntent != null) {
                extraIntents.add(photoIntent);
            }
        }
        if (acceptsVideo(acceptType)) {
            Intent videoIntent = getVideoIntent();
            if (videoIntent != null) {
                extraIntents.add(videoIntent);
            }
        }
        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, extraIntents.toArray(new Parcelable[]{}));

        if (chooserIntent.resolveActivity(getCurrentActivity().getPackageManager()) != null) {
            getCurrentActivity().startActivityForResult(chooserIntent, PICKER_LEGACY);
        } else {
            Log.w("RNCWebViewModule", "there is no Activity to handle this Intent");
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public boolean startPhotoPickerIntent(final ValueCallback<Uri[]> callback, final String[] acceptTypes, final boolean allowMultiple) {
        filePathCallback = callback;

        ArrayList<Parcelable> extraIntents = new ArrayList<>();
        if (!needsCameraPermission()) {
            if (acceptsImages(acceptTypes)) {
                Intent photoIntent = getPhotoIntent();
                if (photoIntent != null) {
                    extraIntents.add(photoIntent);
                }
            }
            if (acceptsVideo(acceptTypes)) {
                Intent videoIntent = getVideoIntent();
                if (videoIntent != null) {
                    extraIntents.add(videoIntent);
                }
            }
        }

        Intent fileSelectionIntent = getFileChooserIntent(acceptTypes, allowMultiple);

        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
        chooserIntent.putExtra(Intent.EXTRA_INTENT, fileSelectionIntent);
        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, extraIntents.toArray(new Parcelable[]{}));

        if (chooserIntent.resolveActivity(getCurrentActivity().getPackageManager()) != null) {
            getCurrentActivity().startActivityForResult(chooserIntent, PICKER);
        } else {
            Log.w("RNCWebViewModule", "there is no Activity to handle this Intent");
        }

        return true;
    }

    protected boolean needsCameraPermission() {
        boolean needed = false;

        PackageManager packageManager = getCurrentActivity().getPackageManager();
        try {
            String[] requestedPermissions = packageManager.getPackageInfo(getReactApplicationContext().getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
            if (Arrays.asList(requestedPermissions).contains(Manifest.permission.CAMERA)
                    && ContextCompat.checkSelfPermission(getCurrentActivity(), Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                needed = true;
            }
        } catch (PackageManager.NameNotFoundException e) {
            needed = true;
        }

        return needed;
    }

    private Intent getPhotoIntent() {
        Intent intent = null;

        try {
            outputImage = getCapturedFile(MimeType.IMAGE);
            Uri outputImageUri = getOutputUri(outputImage);
            intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, outputImageUri);
        } catch (IOException | IllegalArgumentException e) {
            Log.e("CREATE FILE", "Error occurred while creating the File", e);
            e.printStackTrace();
        }

        return intent;
    }

    private Intent getVideoIntent() {
        Intent intent = null;

        try {
            outputVideo = getCapturedFile(MimeType.VIDEO);
            Uri outputVideoUri = getOutputUri(outputVideo);
            intent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, outputVideoUri);
        } catch (IOException | IllegalArgumentException e) {
            Log.e("CREATE FILE", "Error occurred while creating the File", e);
            e.printStackTrace();
        }

        return intent;
    }

    private Intent getFileChooserIntent(String acceptTypes) {
        String _acceptTypes = acceptTypes;
        if (acceptTypes.isEmpty()) {
            _acceptTypes = MimeType.DEFAULT.value;
        }
        if (acceptTypes.matches("\\.\\w+")) {
            _acceptTypes = getMimeTypeFromExtension(acceptTypes.replace(".", ""));
        }
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(_acceptTypes);
        return intent;
    }

    private Intent getFileChooserIntent(String[] acceptTypes, boolean allowMultiple) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(MimeType.DEFAULT.value);
        intent.putExtra(Intent.EXTRA_MIME_TYPES, getAcceptedMimeType(acceptTypes));
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, allowMultiple);
        return intent;
    }

    private Boolean acceptsImages(String types) {
        String mimeType = types;
        if (types.matches("\\.\\w+")) {
            mimeType = getMimeTypeFromExtension(types.replace(".", ""));
        }
        return mimeType.isEmpty() || mimeType.toLowerCase().contains(MimeType.IMAGE.value);
    }

    private Boolean acceptsImages(String[] types) {
        String[] mimeTypes = getAcceptedMimeType(types);
        return arrayContainsString(mimeTypes, MimeType.DEFAULT.value) || arrayContainsString(mimeTypes, MimeType.IMAGE.value);
    }

    private Boolean acceptsVideo(String types) {
        String mimeType = types;
        if (types.matches("\\.\\w+")) {
            mimeType = getMimeTypeFromExtension(types.replace(".", ""));
        }
        return mimeType.isEmpty() || mimeType.toLowerCase().contains(MimeType.VIDEO.value);
    }

    private Boolean acceptsVideo(String[] types) {
        String[] mimeTypes = getAcceptedMimeType(types);
        return arrayContainsString(mimeTypes, MimeType.DEFAULT.value) || arrayContainsString(mimeTypes, MimeType.VIDEO.value);
    }

    private Boolean arrayContainsString(String[] array, String pattern) {
        for (String content : array) {
            if (content.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private String[] getAcceptedMimeType(String[] types) {
        if (noAcceptTypesSet(types)) {
            return new String[]{MimeType.DEFAULT.value};
        }
        String[] mimeTypes = new String[types.length];
        for (int i = 0; i < types.length; i++) {
            String t = types[i];
            // convert file extensions to mime types
            if (t.matches("\\.\\w+")) {
                String mimeType = getMimeTypeFromExtension(t.replace(".", ""));
                if (mimeType != null) {
                    mimeTypes[i] = mimeType;
                } else {
                    mimeTypes[i] = t;
                }
            } else {
                mimeTypes[i] = t;
            }
        }
        return mimeTypes;
    }

    private String getMimeTypeFromExtension(String extension) {
        String type = null;
        if (extension != null) {
            type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        }
        return type;
    }

    private Uri getOutputUri(File capturedFile) {
        // for versions 6.0+ (23) we use the FileProvider to avoid runtime permissions
        String packageName = getReactApplicationContext().getPackageName();
        return FileProvider.getUriForFile(getReactApplicationContext(), packageName + ".fileprovider", capturedFile);
    }

    private File getCapturedFile(MimeType mimeType) throws IOException {
        String prefix = "";
        String suffix = "";

        switch (mimeType) {
            case IMAGE:
                prefix = "image-";
                suffix = ".jpg";
                break;
            case VIDEO:
                prefix = "video-";
                suffix = ".mp4";
                break;
            default:
                break;
        }

        File outputFile;

        File storageDir = getReactApplicationContext().getExternalFilesDir(null);
        outputFile = File.createTempFile(prefix, suffix, storageDir);

        return outputFile;
    }

    private Boolean noAcceptTypesSet(String[] types) {
        // when our array returned from getAcceptTypes() has no values set from the webview
        // i.e. <input type="file" />, without any "accept" attr
        // will be an array with one empty string element, afaik

        return types.length == 0 || (types.length == 1 && types[0] != null && types[0].length() == 0);
    }
}
