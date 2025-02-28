import { StyleSheet } from 'react-native';
import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        width: AppSizes.screen.uncorrectedWidth, // Will auto width - this fixes Fold devices
    },
    contentContainerStyle: {
        flexGrow: 0,
    },
    item: {
        position: 'absolute',
        zIndex: 9,
    },
});

export default styles;
