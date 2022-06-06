import { StyleSheet } from 'react-native';
import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        width: AppSizes.screen.width,
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
