import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

import { getNavigationBarHeight } from '@common/helpers/interface';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    cancelButton: {
        height: AppSizes.screen.heightHalf * 0.1,
        backgroundColor: AppColors.grey,
    },
    avatar: {
        width: AppSizes.moderateScale(30),
        height: AppSizes.moderateScale(30),
        resizeMode: 'contain',
    },
    currencyAvatar: {
        width: AppSizes.moderateScale(30),
        height: AppSizes.moderateScale(30),
        resizeMode: 'contain',
    },
    separator: {
        borderLeftWidth: 1.2,
        borderLeftColor: AppColors.lightBlue,
        marginHorizontal: 10,
    },
    listItem: {
        height: AppSizes.moderateScale(50),
        paddingRight: 5,
        paddingLeft: 10,
        marginVertical: 4,
        borderRadius: 10,
    },
    selectedRow: {
        backgroundColor: AppColors.grey,
    },
    selectedText: {
        color: AppColors.blue,
        fontFamily: AppFonts.base.familyBold,
    },
    footer: {
        paddingBottom: getNavigationBarHeight(),
    },
});

export default styles;
