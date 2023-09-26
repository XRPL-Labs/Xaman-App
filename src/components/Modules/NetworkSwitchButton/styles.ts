import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */

export default StyleService.create({
    buttonContainer: {
        height: AppSizes.scale(28),
        flexDirection: 'row',
        alignSelf: 'flex-end',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: '$tint',
        borderColor: '$transparent',
        borderRadius: AppSizes.scale(18) / 2,
        paddingHorizontal: 10,
        marginRight: -10,
    },
    buttonText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        textAlign: 'center',
        paddingHorizontal: 3,
        marginRight: 5,
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
    },
    pulseCircle: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
});
