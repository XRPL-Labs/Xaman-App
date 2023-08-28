import React, { forwardRef, useState, useRef } from 'react';
import { Animated, View, Text, ViewStyle } from 'react-native';

import Localize from '@locale';

import { LoadingIndicator } from '../LoadingIndicator';
import { Spacer } from '../Spacer';
import { Button } from '../Button';

import WebView, { WebViewProps } from './WebView';

import styles from './styles';

interface WebViewBrowserProps {
    errorMessage?: string;
    containerStyle: ViewStyle | ViewStyle[];
}

const WebViewBrowser = forwardRef<WebViewBrowserProps, WebViewProps>(
    ({ onLoadStart, onLoadEnd, errorMessage, containerStyle, ...otherProps }, ref) => {
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [error, setError] = useState<string>(undefined);
        const fadeAnimation = useRef(new Animated.Value(1)).current;

        const onWebViewLoadStart = () => {
            setIsLoading(true);

            if (error) {
                // clear any error
                setError(undefined);
            }

            // reset fade animation
            fadeAnimation.setValue(1);

            if (typeof onLoadStart === 'function') {
                onLoadStart();
            }
        };

        const onWebViewLoadEnd = () => {
            Animated.timing(fadeAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsLoading(false);

                if (typeof onLoadEnd === 'function') {
                    onLoadEnd();
                }
            });
        };

        const onWebViewLoadingError = (e: any) => {
            setError(e.nativeEvent.description);
        };

        if (error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>{errorMessage || 'Oops! Unable to load the URL'}</Text>
                    <Spacer />
                    <Text style={styles.errorText}>{error || 'Unexpected error'}</Text>
                    <Spacer size={40} />
                    <Button
                        secondary
                        roundedSmall
                        icon="IconRefresh"
                        iconSize={14}
                        onPress={() => {
                            setError(undefined);
                        }}
                        label={Localize.t('global.tryAgain')}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.contentContainer, containerStyle]}>
                {isLoading && (
                    <Animated.View style={[styles.loadingStyle, { opacity: fadeAnimation }]}>
                        <LoadingIndicator size="large" />
                    </Animated.View>
                )}
                {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                <WebView
                    ref={ref}
                    onLoadStart={onWebViewLoadStart}
                    onLoadEnd={onWebViewLoadEnd}
                    onError={onWebViewLoadingError}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...otherProps}
                />
            </View>
        );
    },
);

export default WebViewBrowser;
