import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { Image, NativeModules, ImageSourcePropType } from 'react-native';

import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import codegenNativeCommandsUntyped from 'react-native/Libraries/Utilities/codegenNativeCommands';

import RNCWebView from './WebViewNativeComponent.android';
import { defaultOriginWhitelist, useWebWiewLogic } from './WebViewShared';
import { AndroidWebViewProps, NativeWebViewAndroid } from './WebViewTypes';

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
        'clearFormData',
        'clearCache',
        'clearHistory',
        'loadUrl',
    ],
});

const { resolveAssetSource } = Image;

/**
 * A simple counter to uniquely identify WebView instances. Do not use this for anything else.
 */
let uniqueRef = 0;

const WebViewComponent = forwardRef<{}, AndroidWebViewProps>(
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
            onHttpError: onHttpErrorProp,
            onRenderProcessGone: onRenderProcessGoneProp,
            onMessage: onMessageProp,
            style,
            source,
            nativeConfig,
            onShouldStartLoadWithRequest: onShouldStartLoadWithRequestProp,
            ...otherProps
        },
        ref,
    ) => {
        const messagingModuleName = useRef<string>(`WebViewMessageHandler${(uniqueRef += 1)}`).current;
        const webViewRef = useRef<NativeWebViewAndroid | null>(null);

        const onShouldStartLoadWithRequestCallback = useCallback(
            (shouldStart: boolean, url: string, lockIdentifier?: number) => {
                if (lockIdentifier) {
                    NativeModules.RNCWebView.onShouldStartLoadWithRequestCallback(shouldStart, lockIdentifier);
                } else if (shouldStart) {
                    Commands.loadUrl(webViewRef.current, url);
                }
            },
            [],
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
            onRenderProcessGone,
        } = useWebWiewLogic({
            onNavigationStateChange,
            onLoad,
            onError,
            onHttpErrorProp,
            onLoadEnd,
            onLoadProgress,
            onLoadStart,
            onRenderProcessGoneProp,
            onMessageProp,
            startInLoadingState,
            originWhitelist,
            onShouldStartLoadWithRequestProp,
            onShouldStartLoadWithRequestCallback,
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
                injectJavaScript: (data: string) => Commands.injectJavaScript(webViewRef.current, data),
                requestFocus: () => Commands.requestFocus(webViewRef.current),
                clearFormData: () => Commands.clearFormData(webViewRef.current),
                clearCache: (includeDiskFiles: boolean) => Commands.clearCache(webViewRef.current, includeDiskFiles),
                clearHistory: () => Commands.clearHistory(webViewRef.current),
                endEditing: () => {},
            }),
            [setViewState, webViewRef],
        );

        const directEventCallbacks = useMemo(
            () => ({
                onShouldStartLoadWithRequest,
                onMessage,
            }),
            [onMessage, onShouldStartLoadWithRequest],
        );

        useEffect(() => {
            BatchedBridge.registerCallableModule(messagingModuleName, directEventCallbacks);
        }, [messagingModuleName, directEventCallbacks]);

        const webViewStyles = [styles.container, styles.webView, style];

        if (typeof source !== 'number' && source && 'method' in source) {
            if (source.method === 'POST' && source.headers) {
                console.warn('WebView: `source.headers` is not supported when using POST.');
            } else if (source.method === 'GET' && source.body) {
                console.warn('WebView: `source.body` is not supported when using GET.');
            }
        }

        const NativeWebView = (nativeConfig?.component as typeof NativeWebViewAndroid | undefined) || RNCWebView;

        return (
            <NativeWebView
                key="webViewKey"
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...otherProps}
                messagingModuleName={messagingModuleName}
                onLoadingError={onLoadingError}
                onLoadingFinish={onLoadingFinish}
                onLoadingProgress={onLoadingProgress}
                onLoadingStart={onLoadingStart}
                onHttpError={onHttpError}
                onRenderProcessGone={onRenderProcessGone}
                onMessage={onMessage}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
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

// native implementation should return "true" only for Android 5+
const isFileUploadSupported: () => Promise<boolean> = NativeModules.RNCWebView.isFileUploadSupported();

const WebView = Object.assign(WebViewComponent, { isFileUploadSupported });

export default WebView;
