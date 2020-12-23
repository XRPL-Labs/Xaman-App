import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    contentContainer: {
        flex: 1,
        padding: 35,
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    footerTextContainer: {
        paddingVertical: 9,
    },
});

export default styles;
