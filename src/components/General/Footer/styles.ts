import { StyleSheet } from 'react-native';

import { IsIPhoneX } from '@common/helpers/interface';
import { AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        width: AppSizes.screen.width,
        padding: AppSizes.paddingSml,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        paddingBottom: AppSizes.paddingSml + (IsIPhoneX() ? 34 : 0),
    },
});

export default styles;
