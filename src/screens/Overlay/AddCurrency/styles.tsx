import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    visibleContent: {
        height: AppSizes.heightPercentageToDP(92),
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
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
        marginBottom: AppSizes.navigationBarHeight * 1.1,
    },
});

export default styles;
