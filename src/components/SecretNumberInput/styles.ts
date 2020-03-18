import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleSheet.create({
    // container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    inputBoxRowActive: {
        minHeight: 35,
        height: AppSizes.heightPercentageToDP(6),
    },
    inputBox: {
        flex: 1,
        height: AppSizes.heightPercentageToDP(3.5),
        backgroundColor: AppColors.transparent,
        borderColor: AppColors.greyDark,
        justifyContent: 'center',
        // alignItems: 'center',
        margin: 4,
    },
    inputBoxActive: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.blue,
        backgroundColor: AppColors.white,
    },
    inputBoxActiveError: {
        borderColor: AppColors.red,
    },
    inputText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
    },
    inputTextActive: {
        paddingTop: 0,
        color: AppColors.blue,
    },
    inputTextError: {
        paddingTop: 0,
        color: AppColors.red,
    },
    separator: {
        width: 1,
        backgroundColor: AppColors.greyDark,
        height: '70%',
        alignSelf: 'center',
        borderTopWidth: 5,
        borderBottomWidth: 5,
        borderColor: AppColors.grey,
        opacity: 0.7,
    },
    buttonMiddleRight: {
        backgroundColor: AppColors.blue,
        justifyContent: 'center',
        alignItems: 'center',
        width: AppSizes.scale(60),
        height: AppSizes.scale(35),
        borderTopRightRadius: AppSizes.scale(7),
        borderBottomRightRadius: AppSizes.scale(7),
    },
    buttonMiddleLeft: {
        backgroundColor: AppColors.greyDark,
        justifyContent: 'center',
        alignItems: 'center',
        width: AppSizes.scale(60),
        height: AppSizes.scale(35),
        borderTopLeftRadius: AppSizes.scale(7),
        borderBottomLeftRadius: AppSizes.scale(7),
    },
    // eslint-disable-next-line
    buttonRoundGrey: {
        backgroundColor: '#D8DCE6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginRight: 10,
        width: AppSizes.widthPercentageToDP(12),
        height: AppSizes.widthPercentageToDP(12),
        borderRadius: AppSizes.widthPercentageToDP(12) / 2,
    },
    buttonRoundIcon: {
        tintColor: AppColors.white,
    },
    buttonRoundText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.h3.size,
        color: AppColors.white,
        textAlign: 'center',
    },
    row: {
        backgroundColor: AppColors.green,
        flexDirection: 'row',
    },
    rowStyle: {
        width: '80%',
        left: 0,
        right: 0,
        flexDirection: 'row',
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: AppColors.grey,
        marginBottom: 5,
        position: 'relative',
        alignSelf: 'center',
    },
    rowStyleActive: {
        marginTop: 10,
        marginBottom: 12,
        borderRadius: 12,
        width: '95%',
    },
    rowStyleActiveId: {
        width: 50,
        height: 24,
        paddingVertical: 3,
        // backgroundColor: AppColors.orange,
        alignSelf: 'center',
        alignContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        color: AppColors.white,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: -22,
        zIndex: 5,
    },
    rowStyleInnerError: {
        backgroundColor: AppColors.lightRed,
    },
    rowStyleInnerActive: {
        paddingVertical: 5,
        width: '95%',
        backgroundColor: AppColors.lightBlue,
    },
    rowStyleInnerReadonly: {
        backgroundColor: AppColors.orange,
    },
    RowId: {
        fontSize: AppFonts.base.size * 0.8,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.black,
        paddingVertical: 3,
    },
    RowIdActive: {
        color: AppColors.white,
    },
    RowIdActiveContainer: {
        position: 'absolute',
        top: -5,
        right: '43%',
        paddingVertical: 0,
        paddingHorizontal: 15,
        borderRadius: 10,
        zIndex: 99999,
        backgroundColor: AppColors.blue,
    },
    privateKeyNum: {
        backgroundColor: AppColors.grey,
        borderColor: AppColors.greyDark,
        padding: 8,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        justifyContent: 'center',
    },
    privateKeyNumText: {
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
    },

    // Active states
    privateKeyRowActive: {
        backgroundColor: AppColors.lightOrange,
    },
    privateKeyNumActive: {
        backgroundColor: AppColors.lightOrange,
        borderColor: AppColors.orange,
    },
    privateKeyNumTextActive: {
        color: AppColors.orange,
    },
});
