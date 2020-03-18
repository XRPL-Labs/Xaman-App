import { StyleSheet } from 'react-native';

import { AppSizes, AppFonts, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { position: 'relative', flex: 1, flexDirection: 'column' },
    rowContainer: {
        width: '100%',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: AppColors.grey,
    },
    checkIcon: {
        tintColor: AppColors.blue,
    },
    descriptionText: {
        // paddingVertical: AppSizes.paddingSml,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        fontWeight: 'bold',
        color: AppColors.black,
    },
});

export default styles;
