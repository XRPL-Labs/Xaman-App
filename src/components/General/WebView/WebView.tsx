import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Keyboard } from 'react-native';
import CommunityWebView from 'react-native-webview';
import type { IOSWebViewProps, AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';

/**
 * HTTPS-only. The official package defaults to http://* plus https://*.
 * Non-matching navigations are handed to the OS via Linking.openURL.
 */
export const defaultOriginWhitelist = ['https://*'] as const;

const END_EDITING_SCRIPT =
    '(function(){var el=document.activeElement;if(el&&typeof el.blur==="function"){el.blur();}})();true;';

const rejectFileDownload = () => {
    // Providing this handler makes iOS cancel attachment / non-renderable downloads.
};

export type WebViewProps = IOSWebViewProps & AndroidWebViewProps;

export type WebViewHandle = {
    goBack: () => void;
    goForward: () => void;
    reload: () => void;
    stopLoading: () => void;
    injectJavaScript: (script: string) => void;
    requestFocus: () => void;
    postMessage: (message: string) => void;
    endEditing: () => void;
    clearFormData?: () => void;
    clearCache: (includeDiskFiles: boolean) => void;
    clearHistory?: () => void;
};

// Keep `RefObject<WebView>` working for existing screens.
export type WebView = WebViewHandle;

type NativeWebViewComponent = React.ComponentType<
    WebViewProps & { ref?: React.Ref<WebViewHandle> }
>;

const NativeWebView = CommunityWebView as unknown as NativeWebViewComponent;

const WebViewComponent = forwardRef<WebViewHandle, WebViewProps>((props, ref) => {
    const innerRef = useRef<WebViewHandle>(null);

    useImperativeHandle(
        ref,
        () => ({
            goBack: () => innerRef.current?.goBack(),
            goForward: () => innerRef.current?.goForward(),
            reload: () => innerRef.current?.reload(),
            stopLoading: () => innerRef.current?.stopLoading(),
            injectJavaScript: (script: string) => innerRef.current?.injectJavaScript(script),
            requestFocus: () => innerRef.current?.requestFocus(),
            postMessage: (message: string) => innerRef.current?.postMessage(message),
            endEditing: () => {
                Keyboard.dismiss();
                innerRef.current?.injectJavaScript(END_EDITING_SCRIPT);
            },
            clearFormData: () => innerRef.current?.clearFormData?.(),
            clearCache: (includeDiskFiles: boolean) => innerRef.current?.clearCache(includeDiskFiles),
            clearHistory: () => innerRef.current?.clearHistory?.(),
        }),
        [],
    );

    return (
        <NativeWebView
            {...props}
            ref={innerRef}
            originWhitelist={[...defaultOriginWhitelist]}
            javaScriptEnabled
            javaScriptCanOpenWindowsAutomatically={false}
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            geolocationEnabled={false}
            mediaPlaybackRequiresUserAction
            mixedContentMode="never"
            setSupportMultipleWindows={false}
            allowsAirPlayForMediaPlayback={false}
            allowsLinkPreview={false}
            allowsPictureInPictureMediaPlayback={false}
            allowsFullscreenVideo={false}
            allowsProtectedMedia={false}
            paymentRequestEnabled={false}
            webviewDebuggingEnabled={false}
            enableApplePay={false}
            saveFormDataDisabled
            setDisplayZoomControls={false}
            incognito
            thirdPartyCookiesEnabled
            cacheEnabled={false}
            hideKeyboardAccessoryView
            bounces={false}
            allowsBackForwardNavigationGestures
            mediaCapturePermissionGrantType="prompt"
            fraudulentWebsiteWarningEnabled
            keyboardDisplayRequiresUserAction
            sharedCookiesEnabled={false}
            nestedScrollEnabled={false}
            autoManageStatusBarEnabled={false}
            automaticallyAdjustContentInsets={false}
            renderLoading={() => <></>}
            onFileDownload={rejectFileDownload}
        />
    );
});

WebViewComponent.displayName = 'WebView';

export default WebViewComponent;
