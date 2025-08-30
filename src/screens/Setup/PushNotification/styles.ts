import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    notificationImage: {
        width: AppSizes.screen.width * 0.85,
        height: AppSizes.screen.height * 0.25,
        resizeMode: 'contain',
    },
});

export default styles;
