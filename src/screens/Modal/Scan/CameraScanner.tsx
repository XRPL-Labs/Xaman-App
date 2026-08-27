/**
 * Back-camera QR preview. Visual chrome stays in ScanModal.
 */
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Camera, Code, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

import { AppStyles } from '@theme';

interface Props extends React.PropsWithChildren {
    onRead: (data: string) => void;
    notAuthorizedView: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
}

const CameraScanner = ({ onRead, notAuthorizedView, style, children }: Props) => {
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const onCodeScanned = useCallback(
        (codes: Code[]) => {
            const value = codes[0]?.value;
            if (value) {
                onRead(value);
            }
        },
        [onRead],
    );

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned,
    });

    if (!hasPermission) {
        return <>{notAuthorizedView}</>;
    }

    return (
        <View style={[AppStyles.flex1, style]}>
            {device ? (
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive
                    audio={false}
                    torch={device.hasTorch ? 'on' : 'off'}
                    codeScanner={codeScanner}
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, styles.noDevice]} />
            )}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    noDevice: {
        backgroundColor: '#000',
    },
});

export default CameraScanner;
