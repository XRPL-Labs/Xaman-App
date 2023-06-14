import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Image, NativeModules, ImageSourcePropType } from 'react-native';

import codegenNativeCommandsUntyped from 'react-native/Libraries/Utilities/codegenNativeCommands';
import RNCWebView from './WebViewNativeComponent.ios';
import { defaultOriginWhitelist, useWebWiewLogic } from './WebViewShared';
import { IOSWebViewProps, NativeWebViewIOS, ViewManager } from './WebViewTypes';

import styles from './styles';

// @ts-expect-error react-native doesn't have this type
const codegenNativeCommands = codegenNativeCommandsUntyped as <T extends {}>(options: {
    supportedCommands: (keyof T)[];
}) => T;

const Commands = codegenNativeCommands({
    supportedCommands: [
        'goBack',
        'goForward',
        'reload',
        'stopLoading',
        'injectJavaScript',
        'requestFocus',
        'postMessage',
        'loadUrl',
        'endEditing',
    ],
});

const { resolveAssetSource } = Image;

const RNCWebViewManager = NativeModules.RNCWebViewManager as ViewManager;

const useWarnIfChanges = <T extends unknown>(value: T, name: string) => {
    const ref = useRef(value);
    if (ref.current !== value) {
        console.warn(`Changes to property ${name} do nothing after the initial render.`);
        ref.current = value;
    }
};

const WebViewComponent = forwardRef<{}, IOSWebViewProps>(
    (
        {
            originWhitelist = defaultOriginWhitelist,
            startInLoadingState,
            onNavigationStateChange,
            onLoadStart,
            onError,
            onLoad,
            onLoadEnd,
            onLoadProgress,
            onContentProcessDidTerminate: onContentProcessDidTerminateProp,
            onHttpError: onHttpErrorProp,
            onMessage: onMessageProp,
            style,
            source,
            nativeConfig,
            incognito,
            onShouldStartLoadWithRequest: onShouldStartLoadWithRequestProp,
            ...otherProps
        },
        ref,
    ) => {
        const webViewRef = useRef<NativeWebViewIOS | null>(null);

        const onShouldStartLoadWithRequestCallback = useCallback(
            (shouldStart: boolean, _url: string, lockIdentifier = 0) => {
                const viewManager = nativeConfig?.viewManager || RNCWebViewManager;
                viewManager.startLoadWithResult(!!shouldStart, lockIdentifier);
            },
            [nativeConfig?.viewManager],
        );

        const {
            onLoadingStart,
            onShouldStartLoadWithRequest,
            onMessage,
            setViewState,
            onHttpError,
            onLoadingError,
            onLoadingFinish,
            onLoadingProgress,
            onContentProcessDidTerminate,
        } = useWebWiewLogic({
            onNavigationStateChange,
            onLoad,
            onError,
            onHttpErrorProp,
            onLoadEnd,
            onLoadProgress,
            onLoadStart,
            onMessageProp,
            startInLoadingState,
            originWhitelist,
            onShouldStartLoadWithRequestProp,
            onShouldStartLoadWithRequestCallback,
            onContentProcessDidTerminateProp,
        });

        useImperativeHandle(
            ref,
            () => ({
                goForward: () => Commands.goForward(webViewRef.current),
                goBack: () => Commands.goBack(webViewRef.current),
                reload: () => {
                    setViewState('LOADING');
                    Commands.reload(webViewRef.current);
                },
                stopLoading: () => Commands.stopLoading(webViewRef.current),
                postMessage: (data: string) => Commands.postMessage(webViewRef.current, data),
                requestFocus: () => Commands.requestFocus(webViewRef.current),
                endEditing: () => {
                    Commands.endEditing(webViewRef.current);
                },
            }),
            [setViewState, webViewRef],
        );

        useWarnIfChanges(incognito, 'incognito');

        const webViewStyles = [styles.container, styles.webView, style];
        const NativeWebView = (nativeConfig?.component as typeof NativeWebViewIOS | undefined) || RNCWebView;

        return (
            <NativeWebView
                key="webViewKey"
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...otherProps}
                onLoadingError={onLoadingError}
                onLoadingFinish={onLoadingFinish}
                onLoadingProgress={onLoadingProgress}
                onLoadingStart={onLoadingStart}
                onHttpError={onHttpError}
                onMessage={onMessage}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                onContentProcessDidTerminate={onContentProcessDidTerminate}
                incognito={incognito}
                ref={webViewRef}
                // TODO: find a better way to type this.
                source={resolveAssetSource(source as ImageSourcePropType)}
                style={webViewStyles}
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...nativeConfig?.props}
            />
        );
    },
);

// no native implementation for iOS, depends only on permissions
const isFileUploadSupported: () => Promise<boolean> = async () => true;

const WebView = Object.assign(WebViewComponent, { isFileUploadSupported });

export default WebView;
