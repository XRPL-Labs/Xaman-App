import { StyleSheet } from 'react-native';

import { hasNotch } from '@common/helpers/device';
import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        width: AppSizes.screen.width,
        padding: AppSizes.paddingSml,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        paddingBottom: AppSizes.paddingSml + (hasNotch() ? 34 : 0),
    },
});

export default styles;
