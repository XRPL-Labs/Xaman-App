import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    touchRow: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        borderWidth: 1,
        borderColor: AppColors.grey,
        borderRadius: 15,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    rowHeader: {
        paddingTop: 0,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.grey,
        paddingRight: 0,
    },
    accountIcon: {
        tintColor: AppColors.black,
        resizeMode: 'contain',
        marginTop: 5,
        marginRight: 10,
    },
    rowHeaderText: {
        marginTop: 5,
    },
    rowIcon: {
        tintColor: AppColors.blue,
    },
    rowText: {
        color: AppColors.blue,
    },
    subRow: {
        paddingTop: 12,
    },
    subLabel: {
        paddingBottom: 5,
    },
    tag: {
        flexDirection: 'row',
        paddingHorizontal: 7,
        paddingVertical: 5,
        marginLeft: 10,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: AppColors.lightBlue,
    },
    tagText: {
        textAlign: 'left',
        fontSize: 10,
        fontFamily: AppFonts.subtext.family,
        color: AppColors.blue,
        paddingTop: 1,
    },
    accountLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        color: AppColors.black,
    },
    accessLevelContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: 3,
    },
    accessLevelLabel: {
        marginLeft: 5,
        fontSize: AppFonts.base.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.greyDark,
        includeFontPadding: false,
    },
});

export default styles;
