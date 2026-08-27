import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { HasTopNotch } from '@common/helpers/device';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        backgroundColor: '$background',
        alignItems: 'center',
        // iOS SafeArea / HasTopNotch already insets. Android SafeAreaView is a no-op.
        paddingTop:
            (Platform.OS === 'android' ? AppSizes.statusBarHeight : 0) +
            (HasTopNotch() ? 50 : Platform.OS === 'android' ? 10 : 30),
        paddingHorizontal: AppSizes.paddingSml,
        paddingBottom: 10,
    },
});

export default styles;
