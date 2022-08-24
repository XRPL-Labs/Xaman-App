package libs.webview;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;

import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;

import android.net.http.SslError;
import android.net.Uri;
import android.os.Build;
import android.os.Message;
import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.inputmethod.BaseInputConnection;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;

import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.RenderProcessGoneDetail;

import android.webkit.SslErrorHandler;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;
import androidx.core.util.Pair;

import com.facebook.common.logging.FLog;

import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.scroll.OnScrollDispatchHelper;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.ContentSizeChangeEvent;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;

import libs.webview.WebViewModule.ShouldOverrideUrlLoadingLock.ShouldOverrideCallbackState;
import libs.webview.events.TopLoadingErrorEvent;
import libs.webview.events.TopHttpErrorEvent;
import libs.webview.events.TopLoadingFinishEvent;
import libs.webview.events.TopLoadingProgressEvent;
import libs.webview.events.TopLoadingStartEvent;
import libs.webview.events.TopMessageEvent;
import libs.webview.events.TopShouldStartLoadWithRequestEvent;
import libs.webview.events.TopRenderProcessGoneEvent;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Manages instances of {@link WebView}
 * <p>
 * Can accept following commands:
 * - GO_BACK
 * - GO_FORWARD
 * - RELOAD
 * - LOAD_URL
 * <p>
 * {@link WebView} instances could emit following direct events:
 * - topLoadingFinish
 * - topLoadingStart
 * - topLoadingStart
 * - topLoadingProgress
 * - topShouldStartLoadWithRequest
 * <p>
 * Each event will carry the following properties:
 * - target - view's react tag
 * - url - url set for the webview
 * - loading - whether webview is in a loading state
 * - title - title of the current page
 * - canGoBack - boolean, whether there is anything on a history stack to go back
 * - canGoForward - boolean, whether it is possible to request GO_FORWARD command
 */
@ReactModule(name = WebViewManager.REACT_CLASS)
public class WebViewManager extends SimpleViewManager<WebView> {
    private static final String TAG = "RNCWebViewManager";

    public static final int COMMAND_GO_BACK = 1;
    public static final int COMMAND_GO_FORWARD = 2;
    public static final int COMMAND_RELOAD = 3;
    public static final int COMMAND_STOP_LOADING = 4;
    public static final int COMMAND_POST_MESSAGE = 5;
    public static final int COMMAND_LOAD_URL = 7;
    public static final int COMMAND_FOCUS = 8;

    // android commands
    public static final int COMMAND_CLEAR_FORM_DATA = 1000;
    public static final int COMMAND_CLEAR_CACHE = 1001;
    public static final int COMMAND_CLEAR_HISTORY = 1002;

    protected static final String REACT_CLASS = "RNCWebView";
    protected static final String HTML_ENCODING = "UTF-8";
    protected static final String HTML_MIME_TYPE = "text/html";
    protected static final String JAVASCRIPT_INTERFACE = "ReactNativeWebView";
    protected static final String HTTP_METHOD_POST = "POST";
    // Use `webView.loadUrl("about:blank")` to reliably reset the view
    // state and release page resources (including any running JavaScript).
    protected static final String BLANK_URL = "about:blank";
    protected static final int SHOULD_OVERRIDE_URL_LOADING_TIMEOUT = 250;
    protected WebViewConfig mWebViewConfig;
    protected RNCWebChromeClient mWebChromeClient = null;
    protected @Nullable
    String mUserAgent = null;
    protected @Nullable
    String mUserAgentWithApplicationName = null;


    public WebViewManager() {
        mWebViewConfig = new WebViewConfig() {
            public void configWebView(WebView webView) {
            }
        };
    }

    public WebViewManager(WebViewConfig webViewConfig) {
        mWebViewConfig = webViewConfig;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    protected RNCWebView createRNCWebViewInstance(ThemedReactContext reactContext) {
        return new RNCWebView(reactContext);
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    @Override
    protected WebView createViewInstance(ThemedReactContext reactContext) {
        RNCWebView webView = createRNCWebViewInstance(reactContext);
        setupWebChromeClient(reactContext, webView);
        reactContext.addLifecycleEventListener(webView);
        mWebViewConfig.configWebView(webView);

        WebSettings settings = webView.getSettings();

        settings.setSaveFormData(false);
        settings.setAllowFileAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setAllowContentAccess(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        settings.setJavaScriptEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setDomStorageEnabled(true);
        settings.setBuiltInZoomControls(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(true);

        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // enable cookie for third party website
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        webView.setNestedScrollEnabled(false);

        // Fixes broken full-screen modals/galleries due to body height being 0.
        webView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        // enable debug when build is debug
        if (ReactBuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        return webView;
    }

    @ReactProp(name = "userAgent")
    public void setUserAgent(WebView view, @Nullable String userAgent) {
        mUserAgent = userAgent;

        if (mUserAgent != null) {
            view.getSettings().setUserAgentString(mUserAgent);
        } else if (mUserAgentWithApplicationName != null) {
            view.getSettings().setUserAgentString(mUserAgentWithApplicationName);
        } else {
            // handle unsets of `userAgent` prop as long as device is >= API 17
            view.getSettings().setUserAgentString(WebSettings.getDefaultUserAgent(view.getContext()));
        }
    }



    @ReactProp(name = "messagingModuleName")
    public void setMessagingModuleName(WebView view, String moduleName) {
        ((RNCWebView) view).setMessagingModuleName(moduleName);
    }

    @ReactProp(name = "incognito")
    public void setIncognito(WebView view, boolean enabled) {
        // Don't do anything when incognito is disabled
        if (!enabled) {
            return;
        }

        // Remove all previous cookies
        CookieManager.getInstance().removeAllCookies(null);


        // Disable caching
        view.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
        view.clearHistory();
        view.clearCache(true);

        // No form data or autofill enabled
        view.clearFormData();
        view.getSettings().setSavePassword(false);
        view.getSettings().setSaveFormData(false);
    }

    @ReactProp(name = "source")
    public void setSource(WebView view, @Nullable ReadableMap source) {
        if (source != null) {
            if (source.hasKey("html")) {
                String html = source.getString("html");
                String baseUrl = source.hasKey("baseUrl") ? source.getString("baseUrl") : "";
                view.loadDataWithBaseURL(baseUrl, html, HTML_MIME_TYPE, HTML_ENCODING, null);
                return;
            }
            if (source.hasKey("uri")) {
                String url = source.getString("uri");
                String previousUrl = view.getUrl();
                if (previousUrl != null && previousUrl.equals(url)) {
                    return;
                }
                if (source.hasKey("method")) {
                    String method = source.getString("method");
                    if (method.equalsIgnoreCase(HTTP_METHOD_POST)) {
                        byte[] postData = null;
                        if (source.hasKey("body")) {
                            String body = source.getString("body");
                            try {
                                postData = body.getBytes("UTF-8");
                            } catch (UnsupportedEncodingException e) {
                                postData = body.getBytes();
                            }
                        }
                        if (postData == null) {
                            postData = new byte[0];
                        }
                        view.postUrl(url, postData);
                        return;
                    }
                }
                HashMap<String, String> headerMap = new HashMap<>();
                if (source.hasKey("headers")) {
                    ReadableMap headers = source.getMap("headers");
                    ReadableMapKeySetIterator iter = headers.keySetIterator();
                    while (iter.hasNextKey()) {
                        String key = iter.nextKey();
                        if ("user-agent".equals(key.toLowerCase(Locale.ENGLISH))) {
                            if (view.getSettings() != null) {
                                view.getSettings().setUserAgentString(headers.getString(key));
                            }
                        } else {
                            headerMap.put(key, headers.getString(key));
                        }
                    }
                }
                view.loadUrl(url, headerMap);
                return;
            }
        }
        view.loadUrl(BLANK_URL);
    }

    @ReactProp(name = "onScroll")
    public void setOnScroll(WebView view, boolean hasScrollEvent) {
        ((RNCWebView) view).setHasScrollEvent(hasScrollEvent);
    }

    @Override
    protected void addEventEmitters(ThemedReactContext reactContext, WebView view) {
        // Do not register default touch emitter and let WebView implementation handle touches
        view.setWebViewClient(new RNCWebViewClient());
    }

    @Override
    public Map getExportedCustomDirectEventTypeConstants() {
        Map export = super.getExportedCustomDirectEventTypeConstants();
        if (export == null) {
            export = MapBuilder.newHashMap();
        }
        // Default events but adding them here explicitly for clarity
        export.put(TopLoadingStartEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingStart"));
        export.put(TopLoadingFinishEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingFinish"));
        export.put(TopLoadingErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingError"));
        export.put(TopMessageEvent.EVENT_NAME, MapBuilder.of("registrationName", "onMessage"));
        // !Default events but adding them here explicitly for clarity

        export.put(TopLoadingProgressEvent.EVENT_NAME, MapBuilder.of("registrationName", "onLoadingProgress"));
        export.put(TopShouldStartLoadWithRequestEvent.EVENT_NAME, MapBuilder.of("registrationName", "onShouldStartLoadWithRequest"));
        export.put(ScrollEventType.getJSEventName(ScrollEventType.SCROLL), MapBuilder.of("registrationName", "onScroll"));
        export.put(TopHttpErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", "onHttpError"));
        export.put(TopRenderProcessGoneEvent.EVENT_NAME, MapBuilder.of("registrationName", "onRenderProcessGone"));
        return export;
    }

    @Override
    public @Nullable
    Map<String, Integer> getCommandsMap() {
        return MapBuilder.<String, Integer>builder()
                .put("goBack", COMMAND_GO_BACK)
                .put("goForward", COMMAND_GO_FORWARD)
                .put("reload", COMMAND_RELOAD)
                .put("stopLoading", COMMAND_STOP_LOADING)
                .put("postMessage", COMMAND_POST_MESSAGE)
                .put("loadUrl", COMMAND_LOAD_URL)
                .put("requestFocus", COMMAND_FOCUS)
                .put("clearFormData", COMMAND_CLEAR_FORM_DATA)
                .put("clearCache", COMMAND_CLEAR_CACHE)
                .put("clearHistory", COMMAND_CLEAR_HISTORY)
                .build();
    }

    @Override
    public void receiveCommand(@NonNull WebView root, String commandId, @Nullable ReadableArray args) {
        switch (commandId) {
            case "goBack":
                root.goBack();
                break;
            case "goForward":
                root.goForward();
                break;
            case "reload":
                root.reload();
                break;
            case "stopLoading":
                root.stopLoading();
                break;
            case "postMessage":
                try {
                    RNCWebView reactWebView = (RNCWebView) root;
                    JSONObject eventInitDict = new JSONObject();
                    eventInitDict.put("data", args.getString(0));
                    reactWebView.evaluateJavascript("(function () {" +
                            "var event;" +
                            "var data = " + eventInitDict.toString() + ";" +
                            "try {" +
                            "event = new MessageEvent('message', data);" +
                            "} catch (e) {" +
                            "event = document.createEvent('MessageEvent');" +
                            "event.initMessageEvent('message', true, true, data.data, data.origin, data.lastEventId, data.source);" +
                            "}" +
                            "document.dispatchEvent(event);" +
                            "})();", null);
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                break;
            case "loadUrl":
                if (args == null) {
                    throw new RuntimeException("Arguments for loading an url are null!");
                }
                ((RNCWebView) root).progressChangedFilter.setWaitingForCommandLoadUrl(false);
                root.loadUrl(args.getString(0));
                break;
            case "requestFocus":
                root.requestFocus();
                break;
            case "clearFormData":
                root.clearFormData();
                break;
            case "clearCache":
                boolean includeDiskFiles = args != null && args.getBoolean(0);
                root.clearCache(includeDiskFiles);
                break;
            case "clearHistory":
                root.clearHistory();
                break;
        }
        super.receiveCommand(root, commandId, args);
    }

    @Override
    public void onDropViewInstance(WebView webView) {
        super.onDropViewInstance(webView);
        ((ThemedReactContext) webView.getContext()).removeLifecycleEventListener((RNCWebView) webView);
        ((RNCWebView) webView).cleanupCallbacksAndDestroy();
        mWebChromeClient = null;
    }

    public static WebViewModule getModule(ReactContext reactContext) {
        return reactContext.getNativeModule(WebViewModule.class);
    }

    protected void setupWebChromeClient(ReactContext reactContext, WebView webView) {
        if (mWebChromeClient != null) {
            mWebChromeClient.onHideCustomView();
        }

        mWebChromeClient = new RNCWebChromeClient(reactContext, webView) {
            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(50, 50, Bitmap.Config.ARGB_8888);
            }
        };

        webView.setWebChromeClient(mWebChromeClient);
    }

    protected static class RNCWebViewClient extends WebViewClient {

        protected boolean mLastLoadFailed = false;
        protected RNCWebView.ProgressChangedFilter progressChangedFilter = null;
        protected @Nullable String ignoreErrFailedForThisURL = null;

        public void setIgnoreErrFailedForThisURL(@Nullable String url) {
            ignoreErrFailedForThisURL = url;
        }

        @Override
        public void onPageFinished(WebView webView, String url) {
            super.onPageFinished(webView, url);

            if (!mLastLoadFailed) {
                emitFinishEvent(webView, url);
            }


            WebChromeClient webChromeClient = ((RNCWebView) webView).getWebChromeClient();
            if (webChromeClient instanceof RNCWebChromeClient) {
                ((RNCWebChromeClient) webChromeClient).blockJsDuringLoading = false;
            }

        }

        @Override
        public void onPageStarted(WebView webView, String url, Bitmap favicon) {
            super.onPageStarted(webView, url, favicon);

            mLastLoadFailed = false;

            WebChromeClient webChromeClient = ((RNCWebView) webView).getWebChromeClient();
            if (webChromeClient instanceof RNCWebChromeClient) {
                ((RNCWebChromeClient) webChromeClient).blockJsDuringLoading = true;
            }

            ((RNCWebView) webView).dispatchEvent(
                    webView,
                    new TopLoadingStartEvent(
                            webView.getId(),
                            createWebViewEvent(webView, url)));
        }


//        @Override
//        public WebResourceResponse shouldInterceptRequest(WebView view,
//                                                          WebResourceRequest request) {
//            if (!request.getUrl().getScheme().contains("http"))
//                return null;
//
//            String host = request.getUrl().getHost();
//            if (host.contains("googletagmanager") || host.contains("google-analytics") || host.contains("sentry")) {
//                InputStream stream = new InputStream() {
//                    @Override
//                    public int read() throws IOException {
//                        return -1;
//                    }
//                };
//                WebResourceResponse resp = new WebResourceResponse("text/html", "utf-8", stream);
//                resp.setStatusCodeAndReasonPhrase(400, "Bad request");
//                return resp;
//            }
//
//            return null;
//        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            final RNCWebView rncWebView = (RNCWebView) view;
            final boolean isJsDebugging = ((ReactContext) view.getContext()).getJavaScriptContextHolder().get() == 0;

            if (!isJsDebugging && rncWebView.mCatalystInstance != null) {
                final Pair<Integer, AtomicReference<ShouldOverrideCallbackState>> lock = WebViewModule.shouldOverrideUrlLoadingLock.getNewLock();
                final int lockIdentifier = lock.first;
                final AtomicReference<ShouldOverrideCallbackState> lockObject = lock.second;

                final WritableMap event = createWebViewEvent(view, url);
                event.putInt("lockIdentifier", lockIdentifier);
                rncWebView.sendDirectMessage("onShouldStartLoadWithRequest", event);

                try {
                    assert lockObject != null;
                    synchronized (lockObject) {
                        final long startTime = SystemClock.elapsedRealtime();
                        while (lockObject.get() == ShouldOverrideCallbackState.UNDECIDED) {
                            if (SystemClock.elapsedRealtime() - startTime > SHOULD_OVERRIDE_URL_LOADING_TIMEOUT) {
                                FLog.w(TAG, "Did not receive response to shouldOverrideUrlLoading in time, defaulting to allow loading.");
                                WebViewModule.shouldOverrideUrlLoadingLock.removeLock(lockIdentifier);
                                return false;
                            }
                            lockObject.wait(SHOULD_OVERRIDE_URL_LOADING_TIMEOUT);
                        }
                    }
                } catch (InterruptedException e) {
                    FLog.e(TAG, "shouldOverrideUrlLoading was interrupted while waiting for result.", e);
                    WebViewModule.shouldOverrideUrlLoadingLock.removeLock(lockIdentifier);
                    return false;
                }

                final boolean shouldOverride = lockObject.get() == ShouldOverrideCallbackState.SHOULD_OVERRIDE;
                WebViewModule.shouldOverrideUrlLoadingLock.removeLock(lockIdentifier);

                return shouldOverride;

            } else {
                FLog.w(TAG, "Couldn't use blocking synchronous call for onShouldStartLoadWithRequest due to debugging or missing Catalyst instance, falling back to old event-and-load.");
                progressChangedFilter.setWaitingForCommandLoadUrl(true);
                ((RNCWebView) view).dispatchEvent(
                        view,
                        new TopShouldStartLoadWithRequestEvent(
                                view.getId(),
                                createWebViewEvent(view, url)));
                return true;
            }
        }

        @TargetApi(Build.VERSION_CODES.N)
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            final String url = request.getUrl().toString();
            return this.shouldOverrideUrlLoading(view, url);
        }

        @Override
        public void onReceivedSslError(final WebView webView, final SslErrorHandler handler, final SslError error) {
            // onReceivedSslError is called for most requests, per Android docs: https://developer.android.com/reference/android/webkit/WebViewClient#onReceivedSslError(android.webkit.WebView,%2520android.webkit.SslErrorHandler,%2520android.net.http.SslError)
            // WebView.getUrl() will return the top-level window URL.
            // If a top-level navigation triggers this error handler, the top-level URL will be the failing URL (not the URL of the currently-rendered page).
            // This is desired behavior. We later use these values to determine whether the request is a top-level navigation or a subresource request.
            String topWindowUrl = webView.getUrl();
            String failingUrl = error.getUrl();

            // Cancel request after obtaining top-level URL.
            // If request is cancelled before obtaining top-level URL, undesired behavior may occur.
            // Undesired behavior: Return value of WebView.getUrl() may be the current URL instead of the failing URL.
            handler.cancel();

            if (!topWindowUrl.equalsIgnoreCase(failingUrl)) {
                // If error is not due to top-level navigation, then do not call onReceivedError()
                Log.w(TAG, "Resource blocked from loading due to SSL error. Blocked URL: " + failingUrl);
                return;
            }

            int code = error.getPrimaryError();
            String description = "";
            String descriptionPrefix = "SSL error: ";

            // https://developer.android.com/reference/android/net/http/SslError.html
            switch (code) {
                case SslError.SSL_DATE_INVALID:
                    description = "The date of the certificate is invalid";
                    break;
                case SslError.SSL_EXPIRED:
                    description = "The certificate has expired";
                    break;
                case SslError.SSL_IDMISMATCH:
                    description = "Hostname mismatch";
                    break;
                case SslError.SSL_INVALID:
                    description = "A generic error occurred";
                    break;
                case SslError.SSL_NOTYETVALID:
                    description = "The certificate is not yet valid";
                    break;
                case SslError.SSL_UNTRUSTED:
                    description = "The certificate authority is not trusted";
                    break;
                default:
                    description = "Unknown SSL Error";
                    break;
            }

            description = descriptionPrefix + description;

            this.onReceivedError(
                    webView,
                    code,
                    description,
                    failingUrl
            );
        }

        @Override
        public void onReceivedError(
                WebView webView,
                int errorCode,
                String description,
                String failingUrl) {

            if (ignoreErrFailedForThisURL != null
                    && failingUrl.equals(ignoreErrFailedForThisURL)
                    && errorCode == -1
                    && description.equals("net::ERR_FAILED")) {

                // This is a workaround for a bug in the WebView.
                // See these chromium issues for more context:
                // https://bugs.chromium.org/p/chromium/issues/detail?id=1023678
                // https://bugs.chromium.org/p/chromium/issues/detail?id=1050635
                // This entire commit should be reverted once this bug is resolved in chromium.
                setIgnoreErrFailedForThisURL(null);
                return;
            }

            super.onReceivedError(webView, errorCode, description, failingUrl);
            mLastLoadFailed = true;

            // In case of an error JS side expect to get a finish event first, and then get an error event
            // Android WebView does it in the opposite way, so we need to simulate that behavior
            emitFinishEvent(webView, failingUrl);

            WritableMap eventData = createWebViewEvent(webView, failingUrl);
            eventData.putDouble("code", errorCode);
            eventData.putString("description", description);

            ((RNCWebView) webView).dispatchEvent(
                    webView,
                    new TopLoadingErrorEvent(webView.getId(), eventData));
        }

        @RequiresApi(api = Build.VERSION_CODES.M)
        @Override
        public void onReceivedHttpError(
                WebView webView,
                WebResourceRequest request,
                WebResourceResponse errorResponse) {
            super.onReceivedHttpError(webView, request, errorResponse);

            if (request.isForMainFrame()) {
                WritableMap eventData = createWebViewEvent(webView, request.getUrl().toString());
                eventData.putInt("statusCode", errorResponse.getStatusCode());
                eventData.putString("description", errorResponse.getReasonPhrase());

                ((RNCWebView) webView).dispatchEvent(
                        webView,
                        new TopHttpErrorEvent(webView.getId(), eventData));
            }
        }

        @TargetApi(Build.VERSION_CODES.O)
        @Override
        public boolean onRenderProcessGone(WebView webView, RenderProcessGoneDetail detail) {
            // WebViewClient.onRenderProcessGone was added in O.
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                return false;
            }
            super.onRenderProcessGone(webView, detail);

            if (detail.didCrash()) {
                Log.e(TAG, "The WebView rendering process crashed.");
            } else {
                Log.w(TAG, "The WebView rendering process was killed by the system.");
            }

            // if webView is null, we cannot return any event
            // since the view is already dead/disposed
            // still prevent the app crash by returning true.
            if (webView == null) {
                return true;
            }

            WritableMap event = createWebViewEvent(webView, webView.getUrl());
            event.putBoolean("didCrash", detail.didCrash());

            ((RNCWebView) webView).dispatchEvent(
                    webView,
                    new TopRenderProcessGoneEvent(webView.getId(), event)
            );

            // returning false would crash the app.
            return true;
        }

        protected void emitFinishEvent(WebView webView, String url) {
            ((RNCWebView) webView).dispatchEvent(
                    webView,
                    new TopLoadingFinishEvent(
                            webView.getId(),
                            createWebViewEvent(webView, url)));
        }

        protected WritableMap createWebViewEvent(WebView webView, String url) {
            WritableMap event = Arguments.createMap();
            event.putDouble("target", webView.getId());
            // Don't use webView.getUrl() here, the URL isn't updated to the new value yet in callbacks
            // like onPageFinished
            event.putString("url", url);
            event.putBoolean("loading", !mLastLoadFailed && webView.getProgress() != 100);
            event.putString("title", webView.getTitle());
            event.putBoolean("canGoBack", webView.canGoBack());
            event.putBoolean("canGoForward", webView.canGoForward());
            return event;
        }

        public void setProgressChangedFilter(RNCWebView.ProgressChangedFilter filter) {
            progressChangedFilter = filter;
        }
    }

    protected static class RNCWebChromeClient extends WebChromeClient implements LifecycleEventListener {
        @RequiresApi(api = Build.VERSION_CODES.KITKAT)
        protected static final int FULLSCREEN_SYSTEM_UI_VISIBILITY = View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_IMMERSIVE |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

        protected static final int COMMON_PERMISSION_REQUEST = 3;

        protected ReactContext mReactContext;
        protected View mWebView;
        protected View mVideoView;

        /*
         * - Permissions -
         * As native permissions are asynchronously handled by the PermissionListener, many fields have
         * to be stored to send permissions results to the webview
         */

        // Webview camera & audio permission callback
        protected PermissionRequest permissionRequest;
        // Webview camera & audio permission already granted
        protected List<String> grantedPermissions;

        // true if native permissions dialog is shown, false otherwise
        protected boolean permissionsRequestShown = false;
        // Pending Android permissions for the next request
        protected List<String> pendingPermissions = new ArrayList<>();

        protected RNCWebView.ProgressChangedFilter progressChangedFilter = null;
        protected boolean blockJsDuringLoading = true;

        public RNCWebChromeClient(ReactContext reactContext, WebView webView) {
            this.mReactContext = reactContext;
            this.mWebView = webView;
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {

            final WebView newWebView = new WebView(view.getContext());
            final WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(newWebView);
            resultMsg.sendToTarget();

            return true;
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage message) {
            if (ReactBuildConfig.DEBUG) {
                return super.onConsoleMessage(message);
            }
            // Ignore console logs in non debug builds.
            return true;
        }

        @Override
        public void onProgressChanged(WebView webView, int newProgress) {
            super.onProgressChanged(webView, newProgress);
            final String url = webView.getUrl();
            if (progressChangedFilter.isWaitingForCommandLoadUrl()) {
                return;
            }
            WritableMap event = Arguments.createMap();
            event.putDouble("target", webView.getId());
            event.putString("title", webView.getTitle());
            event.putString("url", url);
            event.putBoolean("canGoBack", webView.canGoBack());
            event.putBoolean("canGoForward", webView.canGoForward());
            event.putDouble("progress", (float) newProgress / 100);
            ((RNCWebView) webView).dispatchEvent(
                    webView,
                    new TopLoadingProgressEvent(
                            webView.getId(),
                            event));
        }

        @TargetApi(Build.VERSION_CODES.LOLLIPOP)
        @Override
        public void onPermissionRequest(final PermissionRequest request) {

            ArrayList<String> grantedPermissions = new ArrayList<>();
            ArrayList<String> requiredPermissions = new ArrayList<>();

            for (String requestedResource : request.getResources()) {
                String requestedPermission = null;

                if (requestedResource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                    requestedPermission = Manifest.permission.RECORD_AUDIO;
                } else if (requestedResource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                    requestedPermission = Manifest.permission.CAMERA;
                }

                // we only allow to grant Audio and Camera access
                if (requestedPermission == null) {
                    request.deny();
                    return;
                }

                // check if permission is already granted to the app
                if (ContextCompat.checkSelfPermission(mReactContext, requestedPermission) == PackageManager.PERMISSION_GRANTED) {
                    grantedPermissions.add(requestedResource);
                } else {
                    requiredPermissions.add(requestedPermission);
                }
            }

            // If all the permissions are already granted, show a dialog for user to confirm the permission
            if (requiredPermissions.isEmpty()) {
                ArrayList<String> finalGrantedPermissions = new ArrayList<>();
                ArrayList<String> processedPermissions = new ArrayList<>();
                for (String permission : grantedPermissions) {
                    String permissionName = permission;
                    if(permission.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)){
                        permissionName = "Microphone";
                    }else if(permission.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)){
                        permissionName = "Camera";
                    }
                    AlertDialog.Builder builder = new AlertDialog.Builder(mReactContext);
                    builder.setMessage(String.format("Allow Browser to use your %s?", permissionName))
                            .setCancelable(false)
                            .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    processedPermissions.add(permission);
                                    finalGrantedPermissions.add(permission);
                                    if (processedPermissions.size() == grantedPermissions.size()) {
                                        request.grant(finalGrantedPermissions.toArray(new String[0]));
                                    }
                                    dialog.dismiss();
                                }
                            })
                            .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    processedPermissions.add(permission);
                                    if (processedPermissions.size() == grantedPermissions.size()) {
                                        if (finalGrantedPermissions.isEmpty()) {
                                            request.deny();
                                        } else {
                                            request.grant(finalGrantedPermissions.toArray(new String[0]));
                                        }
                                    }
                                    dialog.cancel();
                                }
                            });
                    AlertDialog alert = builder.create();
                    alert.show();
                }
                return;
            }

            // Otherwise, ask to Android System for native permissions asynchronously
            this.permissionRequest = request;

            requestPermissions(requiredPermissions);
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            //decline Geolocation permission by default
            callback.invoke(origin, false, false);
        }

        private PermissionAwareActivity getPermissionAwareActivity() {
            Activity activity = mReactContext.getCurrentActivity();
            if (activity == null) {
                throw new IllegalStateException("Tried to use permissions API while not attached to an Activity.");
            } else if (!(activity instanceof PermissionAwareActivity)) {
                throw new IllegalStateException("Tried to use permissions API but the host Activity doesn't implement PermissionAwareActivity.");
            }
            return (PermissionAwareActivity) activity;
        }

        private synchronized void requestPermissions(List<String> permissions) {

            /*
             * If permissions request dialog is displayed on the screen and another request is sent to the
             * activity, the last permission asked is skipped. As a work-around, we use pendingPermissions
             * to store next required permissions.
             */

            if (permissionsRequestShown) {
                pendingPermissions.addAll(permissions);
                return;
            }

            PermissionAwareActivity activity = getPermissionAwareActivity();
            permissionsRequestShown = true;

            activity.requestPermissions(
                    permissions.toArray(new String[0]),
                    COMMON_PERMISSION_REQUEST,
                    webviewPermissionsListener
            );

            // Pending permissions have been sent, the list can be cleared
            pendingPermissions.clear();
        }

        @TargetApi(Build.VERSION_CODES.LOLLIPOP)
        private PermissionListener webviewPermissionsListener = (requestCode, permissions, grantResults) -> {

            permissionsRequestShown = false;

            /*
             * As a "pending requests" approach is used, requestCode cannot help to define if the request
             * came from geolocation or camera/audio. This is why shouldAnswerToPermissionRequest is used
             */
            boolean shouldAnswerToPermissionRequest = false;

            for (int i = 0; i < permissions.length; i++) {

                String permission = permissions[i];
                boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;

                if (permission.equals(Manifest.permission.RECORD_AUDIO)) {
                    if (granted && grantedPermissions != null) {
                        grantedPermissions.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
                    }
                    shouldAnswerToPermissionRequest = true;
                }

                if (permission.equals(Manifest.permission.CAMERA)) {
                    if (granted && grantedPermissions != null) {
                        grantedPermissions.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
                    }
                    shouldAnswerToPermissionRequest = true;
                }
            }

            if (shouldAnswerToPermissionRequest
                    && permissionRequest != null
                    && grantedPermissions != null) {
                permissionRequest.grant(grantedPermissions.toArray(new String[0]));
                permissionRequest = null;
                grantedPermissions = null;
            }

            if (!pendingPermissions.isEmpty()) {
                requestPermissions(pendingPermissions);
                return false;
            }

            return true;
        };

        protected void openFileChooser(ValueCallback<Uri> filePathCallback, String acceptType) {
            getModule(mReactContext).startPhotoPickerIntent(filePathCallback, acceptType);
        }

        protected void openFileChooser(ValueCallback<Uri> filePathCallback) {
            getModule(mReactContext).startPhotoPickerIntent(filePathCallback, "");
        }

        protected void openFileChooser(ValueCallback<Uri> filePathCallback, String acceptType, String capture) {
            getModule(mReactContext).startPhotoPickerIntent(filePathCallback, acceptType);
        }

        @TargetApi(Build.VERSION_CODES.LOLLIPOP)
        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            String[] acceptTypes = fileChooserParams.getAcceptTypes();
            boolean allowMultiple = fileChooserParams.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE;
            return getModule(mReactContext).startPhotoPickerIntent(filePathCallback, acceptTypes, allowMultiple);
        }

        @Override
        public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
            // if page is loading cancel the alert
            if (blockJsDuringLoading) {
                result.cancel();
                return true;
            }

            return super.onJsAlert(view, url, message, result);
        }

        @Override
        public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
            // if page is loading cancel the prompt
            if (blockJsDuringLoading) {
                result.cancel();
                return true;
            }

            return super.onJsPrompt(view, url, message, defaultValue, result);
        }

        @Override
        public void onHostResume() {
            if (mVideoView != null && mVideoView.getSystemUiVisibility() != FULLSCREEN_SYSTEM_UI_VISIBILITY) {
                mVideoView.setSystemUiVisibility(FULLSCREEN_SYSTEM_UI_VISIBILITY);
            }
        }

        @Override
        public void onHostPause() {
        }

        @Override
        public void onHostDestroy() {
        }

        protected ViewGroup getRootView() {
            return (ViewGroup) mReactContext.getCurrentActivity().findViewById(android.R.id.content);
        }

        public void setProgressChangedFilter(RNCWebView.ProgressChangedFilter filter) {
            progressChangedFilter = filter;
        }
    }

    /**
     * Subclass of {@link WebView} that implements {@link LifecycleEventListener} interface in order
     * to call {@link WebView#destroy} on activity destroy event and also to clear the client
     */
    protected static class RNCWebView extends WebView implements LifecycleEventListener {
        protected boolean messagingEnabled = false;
        protected @Nullable String messagingModuleName;
        protected @Nullable RNCWebViewClient mRNCWebViewClient;
        protected @Nullable WebChromeClient mWebChromeClient;
        protected @Nullable CatalystInstance mCatalystInstance;
        protected boolean sendContentSizeChangeEvents = false;
        private OnScrollDispatchHelper mOnScrollDispatchHelper;
        protected boolean hasScrollEvent = false;
        protected boolean nestedScrollEnabled = false;
        protected ProgressChangedFilter progressChangedFilter;
        private static final int IME_FLAG_NO_PERSONALIZED_LEARNING = 0x1000000;

        /**
         * WebView must be created with an context of the current activity
         * <p>
         * Activity Context is required for creation of dialogs internally by WebView
         * Reactive Native needed for access to ReactNative internal system functionality
         */
        public RNCWebView(ThemedReactContext reactContext) {
            super(reactContext);
            this.createCatalystInstance();
            // enable messaging
            this.addJavascriptInterface(createRNCWebViewBridge(this), JAVASCRIPT_INTERFACE);
            progressChangedFilter = new ProgressChangedFilter();
        }

        public void setHasScrollEvent(boolean hasScrollEvent) {
            this.hasScrollEvent = hasScrollEvent;
        }

        public void setNestedScrollEnabled(boolean nestedScrollEnabled) {
            this.nestedScrollEnabled = nestedScrollEnabled;
        }

        @Override
        public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
            InputConnection inputConnection;
            if (!usingGoogleKeyboard()) {
                inputConnection = super.onCreateInputConnection(outAttrs);
            } else {
                inputConnection = new BaseInputConnection(this, false);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    outAttrs.imeOptions = EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING;
                } else {
                    // Cover OS versions below Oreo
                    outAttrs.imeOptions = IME_FLAG_NO_PERSONALIZED_LEARNING;
                }
            }

            return inputConnection;
        }


        public boolean usingGoogleKeyboard() {
            final InputMethodManager richImm =
                    (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);

            boolean isKeyboard = false;

            final Field field;
            try {
                field = richImm.getClass().getDeclaredField("mCurId");
                field.setAccessible(true);
                Object value = field.get(richImm);
                isKeyboard = Objects.equals(value, "com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME");
            } catch (IllegalAccessException | NoSuchFieldException e) {
                return false;
            }
            return isKeyboard;
        }

        @Override
        public void onHostResume() {
            // do nothing
        }

        @Override
        public void onHostPause() {
            // do nothing
        }

        @Override
        public void onHostDestroy() {
            cleanupCallbacksAndDestroy();
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            if (this.nestedScrollEnabled) {
                requestDisallowInterceptTouchEvent(true);
            }
            return super.onTouchEvent(event);
        }

        @Override
        protected void onSizeChanged(int w, int h, int ow, int oh) {
            super.onSizeChanged(w, h, ow, oh);

            if (sendContentSizeChangeEvents) {
                dispatchEvent(
                        this,
                        new ContentSizeChangeEvent(
                                this.getId(),
                                w,
                                h
                        )
                );
            }
        }

        @Override
        public void setWebViewClient(WebViewClient client) {
            super.setWebViewClient(client);
            if (client instanceof RNCWebViewClient) {
                mRNCWebViewClient = (RNCWebViewClient) client;
                mRNCWebViewClient.setProgressChangedFilter(progressChangedFilter);
            }
        }


        @Override
        public void setWebChromeClient(WebChromeClient client) {
            this.mWebChromeClient = client;
            super.setWebChromeClient(client);
            if (client instanceof RNCWebChromeClient) {
                ((RNCWebChromeClient) client).setProgressChangedFilter(progressChangedFilter);
            }
        }

        public @Nullable
        RNCWebViewClient getRNCWebViewClient() {
            return mRNCWebViewClient;
        }

        public @Nullable
        WebChromeClient getWebChromeClient() {
            return mWebChromeClient;
        }

        protected RNCWebViewBridge createRNCWebViewBridge(RNCWebView webView) {
            return new RNCWebViewBridge(webView);
        }

        protected void createCatalystInstance() {
            ReactContext reactContext = (ReactContext) this.getContext();

            if (reactContext != null) {
                mCatalystInstance = reactContext.getCatalystInstance();
            }
        }

        public void setMessagingModuleName(String moduleName) {
            messagingModuleName = moduleName;
        }

        public void onMessage(String message) {
            ReactContext reactContext = (ReactContext) this.getContext();
            RNCWebView mContext = this;

            if (mRNCWebViewClient != null) {
                WebView webView = this;
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        if (mRNCWebViewClient == null) {
                            return;
                        }
                        WritableMap data = mRNCWebViewClient.createWebViewEvent(webView, webView.getUrl());
                        data.putString("data", message);

                        if (mCatalystInstance != null) {
                            mContext.sendDirectMessage("onMessage", data);
                        } else {
                            dispatchEvent(webView, new TopMessageEvent(webView.getId(), data));
                        }
                    }
                });
            } else {
                WritableMap eventData = Arguments.createMap();
                eventData.putString("data", message);

                if (mCatalystInstance != null) {
                    this.sendDirectMessage("onMessage", eventData);
                } else {
                    dispatchEvent(this, new TopMessageEvent(this.getId(), eventData));
                }
            }
        }

        protected void sendDirectMessage(final String method, WritableMap data) {
            WritableNativeMap event = new WritableNativeMap();
            event.putMap("nativeEvent", data);

            WritableNativeArray params = new WritableNativeArray();
            params.pushMap(event);

            mCatalystInstance.callFunction(messagingModuleName, method, params);
        }

        protected void onScrollChanged(int x, int y, int oldX, int oldY) {
            super.onScrollChanged(x, y, oldX, oldY);

            if (!hasScrollEvent) {
                return;
            }

            if (mOnScrollDispatchHelper == null) {
                mOnScrollDispatchHelper = new OnScrollDispatchHelper();
            }

            if (mOnScrollDispatchHelper.onScrollChanged(x, y)) {
                ScrollEvent event = ScrollEvent.obtain(
                        this.getId(),
                        ScrollEventType.SCROLL,
                        x,
                        y,
                        mOnScrollDispatchHelper.getXFlingVelocity(),
                        mOnScrollDispatchHelper.getYFlingVelocity(),
                        this.computeHorizontalScrollRange(),
                        this.computeVerticalScrollRange(),
                        this.getWidth(),
                        this.getHeight());

                dispatchEvent(this, event);
            }
        }

        protected void dispatchEvent(WebView webView, Event event) {
            ReactContext reactContext = (ReactContext) webView.getContext();
            EventDispatcher eventDispatcher =
                    reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            eventDispatcher.dispatchEvent(event);
        }

        protected void cleanupCallbacksAndDestroy() {
            setWebViewClient(null);
            destroy();
        }

        @Override
        public void destroy() {
            if (mWebChromeClient != null) {
                mWebChromeClient.onHideCustomView();
            }
            super.destroy();
        }

        protected class RNCWebViewBridge {
            RNCWebView mContext;

            RNCWebViewBridge(RNCWebView c) {
                mContext = c;
            }

            /**
             * This method is called whenever JavaScript running within the web view calls:
             * - window[JAVASCRIPT_INTERFACE].postMessage
             */
            @JavascriptInterface
            public void postMessage(String message) {
                mContext.onMessage(message);
            }
        }

        protected static class ProgressChangedFilter {
            private boolean waitingForCommandLoadUrl = false;

            public void setWaitingForCommandLoadUrl(boolean isWaiting) {
                waitingForCommandLoadUrl = isWaiting;
            }

            public boolean isWaitingForCommandLoadUrl() {
                return waitingForCommandLoadUrl;
            }
        }
    }
}
