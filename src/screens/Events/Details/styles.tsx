import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
        borderBottomColor: AppColors.grey,
        borderBottomWidth: 1,
    },
    extraHeaderContainer: {
        padding: 25,
        borderBottomColor: AppColors.grey,
        borderBottomWidth: 1,
    },
    detailsContainer: {
        width: AppSizes.screen.width,
        padding: 25,
    },
    amountContainer: {
        backgroundColor: AppColors.light,
        paddingVertical: 20,
        paddingHorizontal: 30,
        marginTop: 40,
        borderRadius: 50,
    },
    amountText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
        color: AppColors.blue,
    },
    statusText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        marginBottom: 20,
    },
    statusSuccess: {
        color: AppColors.green,
    },
    statusFailed: {
        color: AppColors.red,
    },
    dateText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: AppColors.greyDark,
        textAlign: 'left',
    },
    hashText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
        color: AppColors.greyDark,
        textAlign: 'left',
    },
    labelText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        marginBottom: 8,
    },
    contentText: {
        fontFamily: AppFonts.base.familyMono,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: AppColors.black,
    },
    dangerHeader: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: AppSizes.paddingSml,
        backgroundColor: AppColors.red,
    },
    outgoingColor: {
        color: AppColors.red,
        tintColor: AppColors.red,
    },
    incomingColor: {
        color: AppColors.blue,
        tintColor: AppColors.blue,
    },
    orangeColor: {
        color: AppColors.orange,
        tintColor: AppColors.orange,
    },
    naturalColor: {
        color: AppColors.greyDark,
        tintColor: AppColors.greyDark,
    },
});

export default styles;
