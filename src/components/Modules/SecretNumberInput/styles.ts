import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    inputBoxRowActive: {
        minHeight: 35,
        height: AppSizes.heightPercentageToDP(6),
    },
    inputBox: {
        flex: 1,
        height: AppSizes.heightPercentageToDP(3.5),
        backgroundColor: '$transparent',
        borderColor: '$grey',
        justifyContent: 'center',
        // alignItems: 'center',
        margin: 4,
    },
    inputBoxActive: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '$blue',
        backgroundColor: '$tint',
    },
    inputBoxActiveError: {
        borderColor: '$red',
    },
    inputText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        textAlign: 'center',
        color: '$blue',
    },
    inputTextActive: {
        paddingTop: 0,
        color: '$textPrimary',
    },
    inputTextError: {
        paddingTop: 0,
        color: '$red',
    },
    separator: {
        width: 1,
        backgroundColor: '$grey',
        height: '70%',
        alignSelf: 'center',
        borderTopWidth: 5,
        borderBottomWidth: 5,
        borderColor: '$grey',
        opacity: 0.7,
    },
    buttonMiddleRight: {
        backgroundColor: '$blue',
        justifyContent: 'center',
        alignItems: 'center',
        width: AppSizes.scale(60),
        height: AppSizes.scale(35),
        borderTopRightRadius: AppSizes.scale(7),
        borderBottomRightRadius: AppSizes.scale(7),
    },
    buttonMiddleLeft: {
        backgroundColor: '$grey',
        justifyContent: 'center',
        alignItems: 'center',
        width: AppSizes.scale(60),
        height: AppSizes.scale(35),
        borderTopLeftRadius: AppSizes.scale(7),
        borderBottomLeftRadius: AppSizes.scale(7),
    },
    buttonRoundBlack: {
        backgroundColor: StyleService.isDarkMode() ? '$tint' : '$black',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginRight: 10,
        width: AppSizes.widthPercentageToDP(12),
        height: AppSizes.widthPercentageToDP(12),
        borderRadius: AppSizes.widthPercentageToDP(12) / 2,
    },
    buttonRoundIcon: {
        tintColor: '$white',
    },
    rowStyle: {
        width: '80%',
        left: 0,
        right: 0,
        flexDirection: 'row',
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '$lightGrey',
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
        alignSelf: 'center',
        alignContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '$white',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: -22,
        zIndex: 5,
    },
    rowStyleInnerGreen: {
        backgroundColor: '$green',
    },
    rowStyleInnerGreenText: {
        color: '$white',
    },
    rowStyleInnerError: {
        backgroundColor: '$lightRed',
    },
    rowStyleInnerActive: {
        paddingVertical: 5,
        width: '95%',
        backgroundColor: '$lightBlue',
    },
    rowStyleInnerReadonly: {
        backgroundColor: '$lightOrange',
    },
    RowId: {
        fontSize: AppFonts.base.size * 0.8,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
        paddingVertical: 3,
    },
    RowIdActive: {
        color: '$white',
    },
    RowIdActiveContainer: {
        position: 'absolute',
        top: -5,
        right: '43%',
        paddingVertical: 0,
        paddingHorizontal: 15,
        borderRadius: 10,
        zIndex: 99999,
        backgroundColor: '$blue',
    },
    privateKeyNum: {
        backgroundColor: '$grey',
        borderColor: '$grey',
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
        backgroundColor: '$lightOrange',
    },
    privateKeyNumActive: {
        backgroundColor: '$lightOrange',
        borderColor: '$orange',
    },
    privateKeyNumTextActive: {
        color: '$orange',
    },
});
