/* eslint-disable react/no-multi-comp, max-classes-per-file */

import { Component } from 'react';
import {
    NativeSyntheticEvent,
    ViewProps,
    StyleProp,
    ViewStyle,
    UIManagerStatic,
    NativeScrollEvent,
} from 'react-native';

type WebViewCommands =
    | 'goForward'
    | 'goBack'
    | 'reload'
    | 'stopLoading'
    | 'postMessage'
    | 'injectJavaScript'
    | 'loadUrl'
    | 'requestFocus';

type AndroidWebViewCommands = 'clearHistory' | 'clearCache' | 'clearFormData';

interface RNCWebViewUIManager<Commands extends string> extends UIManagerStatic {
    getViewManagerConfig: (name: string) => {
        Commands: { [key in Commands]: number };
    };
}

export type RNCWebViewUIManagerAndroid = RNCWebViewUIManager<WebViewCommands | AndroidWebViewCommands>;
export type RNCWebViewUIManagerIOS = RNCWebViewUIManager<WebViewCommands>;

type WebViewState = 'IDLE' | 'LOADING' | 'ERROR';

interface BaseState {
    viewState: WebViewState;
}

interface NormalState extends BaseState {
    viewState: 'IDLE' | 'LOADING';
    lastErrorEvent: WebViewError | null;
}

interface ErrorState extends BaseState {
    viewState: 'ERROR';
    lastErrorEvent: WebViewError;
}

export type State = NormalState | ErrorState;

// eslint-disable-next-line react/prefer-stateless-function
declare class NativeWebViewIOSComponent extends Component<IOSNativeWebViewProps> {}
declare const NativeWebViewIOSBase: typeof NativeWebViewIOSComponent;
export class NativeWebViewIOS extends NativeWebViewIOSBase {}

// eslint-disable-next-line react/prefer-stateless-function
declare class NativeWebViewAndroidComponent extends Component<AndroidNativeWebViewProps> {}
declare const NativeWebViewAndroidBase: typeof NativeWebViewAndroidComponent;
export class NativeWebViewAndroid extends NativeWebViewAndroidBase {}

export interface WebViewNativeEvent {
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: number;
}

export interface WebViewNativeProgressEvent extends WebViewNativeEvent {
    progress: number;
}

export interface WebViewNavigation extends WebViewNativeEvent {
    navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | 'other';
    mainDocumentURL?: string;
}

export interface ShouldStartLoadRequest extends WebViewNavigation {
    isTopFrame: boolean;
}

export interface WebViewMessage extends WebViewNativeEvent {
    data: string;
}

export interface WebViewError extends WebViewNativeEvent {
    /**
     * `domain` is only used on iOS and macOS
     */
    domain?: string;
    code: number;
    description: string;
}

export interface WebViewHttpError extends WebViewNativeEvent {
    description: string;
    statusCode: number;
}

export interface WebViewRenderProcessGoneDetail {
    didCrash: boolean;
}

export type WebViewEvent = NativeSyntheticEvent<WebViewNativeEvent>;

export type WebViewProgressEvent = NativeSyntheticEvent<WebViewNativeProgressEvent>;

export type WebViewNavigationEvent = NativeSyntheticEvent<WebViewNavigation>;

export type ShouldStartLoadRequestEvent = NativeSyntheticEvent<ShouldStartLoadRequest>;

export type WebViewMessageEvent = NativeSyntheticEvent<WebViewMessage>;

export type WebViewErrorEvent = NativeSyntheticEvent<WebViewError>;

export type WebViewTerminatedEvent = NativeSyntheticEvent<WebViewNativeEvent>;

export type WebViewHttpErrorEvent = NativeSyntheticEvent<WebViewHttpError>;

export type WebViewRenderProcessGoneEvent = NativeSyntheticEvent<WebViewRenderProcessGoneDetail>;

export type WebViewScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export interface WebViewSourceUri {
    /**
     * The URI to load in the `WebView`. Can be a local or remote file.
     */
    uri: string;

    /**
     * The HTTP Method to use. Defaults to GET if not specified.
     * NOTE: On Android, only GET and POST are supported.
     */
    method?: string;

    /**
     * Additional HTTP headers to send with the request.
     * NOTE: On Android, this can only be used with GET requests.
     */
    headers?: Object;

    /**
     * The HTTP body to send with the request. This must be a valid
     * UTF-8 string, and will be sent exactly as specified, with no
     * additional encoding (e.g. URL-escaping or base64) applied.
     * NOTE: On Android, this can only be used with POST requests.
     */
    body?: string;
}

export interface WebViewSourceHtml {
    /**
     * A static HTML page to display in the WebView.
     */
    html: string;
    /**
     * The base URL to be used for any relative links in the HTML.
     */
    baseUrl?: string;
}

export interface WebViewCustomMenuItems {
    /**
     * The unique key that will be added as a selector on the webview
     * Returned by the `onCustomMenuSelection` callback
     */
    key: string;
    /**
     * The label to appear on the UI Menu when selecting text
     */
    label: string;
}

export type WebViewSource = WebViewSourceUri | WebViewSourceHtml;

export interface ViewManager {
    startLoadWithResult: Function;
}

export interface WebViewNativeConfig {
    /**
     * The native component used to render the WebView.
     */
    component?: typeof NativeWebViewIOS | typeof NativeWebViewAndroid;
    /**
     * Set props directly on the native component WebView. Enables custom props which the
     * original WebView doesn't pass through.
     */
    props?: Object;
    /**
     * Set the ViewManager to use for communication with the native side.
     * @platform ios, macos
     */
    viewManager?: ViewManager;
}

export type OnShouldStartLoadWithRequest = (event: ShouldStartLoadRequest) => boolean;

export interface CommonNativeWebViewProps extends ViewProps {
    incognito?: boolean;
    onScroll?: (event: WebViewScrollEvent) => void;
    onLoadingError: (event: WebViewErrorEvent) => void;
    onLoadingFinish: (event: WebViewNavigationEvent) => void;
    onLoadingProgress: (event: WebViewProgressEvent) => void;
    onLoadingStart: (event: WebViewNavigationEvent) => void;
    onHttpError: (event: WebViewHttpErrorEvent) => void;
    onMessage: (event: WebViewMessageEvent) => void;
    onShouldStartLoadWithRequest: (event: ShouldStartLoadRequestEvent) => void;
    // TODO: find a better way to type this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source: any;
    userAgent?: string;
    /**
     * Append to the existing user-agent. Overridden if `userAgent` is set.
     */
}

export interface AndroidNativeWebViewProps extends CommonNativeWebViewProps {
    onContentSizeChange?: (event: WebViewEvent) => void;
    onRenderProcessGone?: (event: WebViewRenderProcessGoneEvent) => void;
    messagingModuleName?: string;
}

export declare type ContentInsetAdjustmentBehavior = 'automatic' | 'scrollableAxes' | 'never' | 'always';

export interface IOSNativeWebViewProps extends CommonNativeWebViewProps {
    onContentProcessDidTerminate?: (event: WebViewTerminatedEvent) => void;
}

export interface IOSWebViewProps extends WebViewSharedProps {
    /**
     * Does not store any data within the lifetime of the WebView.
     */
    incognito?: boolean;

    /**
     * The custom user agent string.
     */
    userAgent?: string;

    /**
     * Function that is invoked when the WebKit WebView content process gets terminated.
     * @platform ios
     */
    onContentProcessDidTerminate?: (event: WebViewTerminatedEvent) => void;

    /**
     * An array of objects which will be added to the UIMenu controller when selecting text.
     * These will appear after a long press to select text.
     */
    menuItems?: WebViewCustomMenuItems[];

    /**
     * The function fired when selecting a custom menu item created by `menuItems`.
     * It passes a WebViewEvent with a `nativeEvent`, where custom keys are passed:
     * `customMenuKey`: the string of the menu item
     * `selectedText`: the text selected on the document
     */
    onCustomMenuSelection?: (event: WebViewEvent) => void;
}

export interface AndroidWebViewProps extends WebViewSharedProps {
    onNavigationStateChange?: (event: WebViewNavigation) => void;
    onContentSizeChange?: (event: WebViewEvent) => void;

    /**
     * Function that is invoked when the `WebView` process crashes or is killed by the OS.
     * Works only on Android (minimum API level 26).
     */
    onRenderProcessGone?: (event: WebViewRenderProcessGoneEvent) => void;

    /**
     * Sets the user-agent for the `WebView`.
     * @platform android
     */
    userAgent?: string;
}

export interface WebViewSharedProps extends ViewProps {
    /**
     * Loads static html or a uri (with optional headers) in the WebView.
     */
    source?: WebViewSource;

    /**
     * Stylesheet object to set the style of the container view.
     */
    containerStyle?: StyleProp<ViewStyle>;

    /**
     * Function that is invoked when the `WebView` scrolls.
     */
    onScroll?: (event: WebViewScrollEvent) => void;

    /**
     * Function that is invoked when the `WebView` has finished loading.
     */
    onLoad?: (event: WebViewNavigationEvent) => void;

    /**
     * Function that is invoked when the `WebView` load succeeds or fails.
     */
    onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;

    /**
     * Function that is invoked when the `WebView` starts loading.
     */
    onLoadStart?: (event: WebViewNavigationEvent) => void;

    /**
     * Function that is invoked when the `WebView` load fails.
     */
    onError?: (event: WebViewErrorEvent) => void;

    /**
     * Function that is invoked when the `WebView` receives an error status code.
     * Works on iOS and Android (minimum API level 23).
     */
    onHttpError?: (event: WebViewHttpErrorEvent) => void;

    /**
     * Function that is invoked when the `WebView` loading starts or ends.
     */
    onNavigationStateChange?: (event: WebViewNavigation) => void;

    /**
     * Function that is invoked when the webview calls `window.ReactNativeWebView.postMessage`.
     * Setting this property will inject this global into your webview.
     *
     * `window.ReactNativeWebView.postMessage` accepts one argument, `data`, which will be
     * available on the event object, `event.nativeEvent.data`. `data` must be a string.
     */
    onMessage?: (event: WebViewMessageEvent) => void;

    /**
     * Function that is invoked when the `WebView` is loading.
     */
    onLoadProgress?: (event: WebViewProgressEvent) => void;

    /**
     * Boolean value that forces the `WebView` to show the loading view
     * on the first load.
     */
    startInLoadingState?: boolean;

    /**
     * List of origin strings to allow being navigated to. The strings allow
     * wildcards and get matched against *just* the origin (not the full URL).
     * If the user taps to navigate to a new page but the new page is not in
     * this whitelist, we will open the URL in Safari.
     * The default whitelisted origins are "http://*" and "https://*".
     */
    readonly originWhitelist?: string[];

    /**
     * Function that allows custom handling of any web view requests. Return
     * `true` from the function to continue loading the request and `false`
     * to stop loading. The `navigationType` is always `other` on android.
     */
    onShouldStartLoadWithRequest?: OnShouldStartLoadWithRequest;

    /**
     * Override the native component used to render the WebView. Enables a custom native
     * WebView which uses the same JavaScript as the original WebView.
     */
    nativeConfig?: WebViewNativeConfig;
}
