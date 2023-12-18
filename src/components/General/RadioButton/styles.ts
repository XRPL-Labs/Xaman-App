import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    content: {
        width: '100%',
        borderRadius: 20,
        padding: AppSizes.paddingSml,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$lightGrey',
        borderColor: '$lightGrey',
        color: '$silver',
        borderWidth: 3,
        marginBottom: 20,
    },
    dot: {
        height: 26,
        width: 26,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$grey',
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotSelected: {
        borderColor: '$blue',
    },
    filled: {
        height: 15,
        width: 15,
        borderRadius: 8,
        backgroundColor: '$blue',
        color: '$blue',
    },
    disabled: {
        opacity: 0.6,
    },
    selectedDisabled: {
        opacity: 0.6,
        borderColor: '$lightBlue',
    },
    selected: {
        backgroundColor: '$tint',
        borderColor: '$blue',
    },
    textColor: {
        color: '$grey',
    },
    textColorSelected: {
        color: '$textPrimary',
    },
    labelSmall: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
    },
    descriptionText: {
        marginTop: 4,
    },
});
