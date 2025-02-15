import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */

export default StyleService.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '$tint',
        borderColor: '$transparent',
        borderRadius: AppSizes.scale(18) / 2,
    },
    borderW0: {
        borderWidth: 0,
    },
    borderW1: {
        borderWidth: 1,
    },
    buttonText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.subtext.size,
        color: '$textDark',
        textAlign: 'left',
        paddingHorizontal: 5,
        paddingTop: 2,
    },
    pillFontSize: {
        fontSize: AppFonts.subtext.size * 0.9,
    },
    exclamationMarkText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.small.size,
        color: '$textContrast',
        textAlign: 'center',
    },
    switchPillContainer: {
        backgroundColor: '$tint',
        borderRadius: 9,
        paddingHorizontal: 5,
    },
    theSelectedNetwork: {
        backgroundColor: '$white',
        borderRadius: AppSizes.scale(18) / 2 - 3,
        paddingLeft: 4,
        paddingRight: 1,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '$white',
    },
    theOtherNetworkText: {
        color: '$textSecondary',
    },
    theOtherNetworkLeft: {
        marginRight: 2,
    },
    theOtherNetworkRight: {
        marginLeft: 3,
        // paddingLeft: 5,
        // borderLeftWidth: 1,
        // borderColor: 'red',
    },
    pulseWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    pulseCircle: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    iconChevron: {
        tintColor: '$contrast',
    },
});
