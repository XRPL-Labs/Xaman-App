import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */

export default StyleService.create({
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        // backgroundColor: '$tint',
        borderColor: '$transparent',
        borderRadius: AppSizes.scale(18) / 2,
        // paddingHorizontal: 10,
    },
    buttonText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        textAlign: 'left',
        paddingHorizontal: 5,
        paddingTop: 2,
    },
    exclamationMarkText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.small.size,
        color: '$textContrast',
        textAlign: 'center',
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
