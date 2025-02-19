import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    digits: {
        height: AppSizes.verticalScale(80),
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    digitsCondensed: {
        height: AppSizes.screen.height < 800
            ? AppSizes.verticalScale(50)
            : AppSizes.verticalScale(80),
    },
    keyboardWrapCondensed: {
        marginTop: AppSizes.screen.height < 800
            ? AppSizes.verticalScale(20)
            : AppSizes.verticalScale(50),
    },
    hiddenInput: {
        width: 1,
        height: 1,
        opacity: 0,
    },
    textInput: {
        fontSize: 0,
        paddingBottom: 0,
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        textAlign: 'center',
    },
    pinStyle: {
        width: 18,
        height: 18,
        marginRight: 12,
        marginLeft: 12,
        borderRadius: 9,
        opacity: 0.3,
        backgroundColor: '$silver',
    },
    pinActiveStyle: {
        opacity: 1.0,
        backgroundColor: '$blue',
    },
    keyboardWrap: {
        width: AppSizes.screen.width,
        marginTop: AppSizes.verticalScale(50),
    },
    numWrap: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    line: {
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 45,
        // backgroundColor: 'red',
        width: AppSizes.moderateScale(90),
        height: AppSizes.verticalScale(65),
    },
    numTextInt: {
        color: '$textPrimary',
        textAlign: 'center',
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.h3.size,
    },
    numTextAlpha: {
        fontSize: AppFonts.base.size * 0.65,
        textAlign: 'center',
        color: '$textPrimary',
        letterSpacing: 2,
    },
    bottomWrap: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    iconStyle: {
        tintColor: '$contrast',
    },
});
