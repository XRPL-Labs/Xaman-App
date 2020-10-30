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
    },
    amountHeaderContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    memoContainer: {
        width: AppSizes.screen.width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 25,
        paddingHorizontal: 25,
    },
    extraHeaderContainer: {
        padding: 25,
        borderTopColor: AppColors.grey,
        borderTopWidth: 1,
    },
    actionButtonsContainer: {
        paddingHorizontal: 25,
        paddingBottom: 25,
    },
    detailsContainer: {
        borderTopColor: AppColors.grey,
        borderTopWidth: 1,
        width: AppSizes.screen.width,
        padding: 25,
    },
    amountContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.light,
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    amountContainerSmall: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.light,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    amountText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
        color: AppColors.blue,
    },
    amountTextSmall: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        color: AppColors.black,
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
    memoText: {
        fontFamily: AppFonts.base.family,
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
