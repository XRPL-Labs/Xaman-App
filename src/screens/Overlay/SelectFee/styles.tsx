import StyleService from '@services/StyleService';

import Sizes from '@theme/sizes';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    serviceFeeItem: {
        paddingRight: Sizes.padding + 12,
        paddingLeft: Sizes.padding + 12,
    },
    feeItem: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$lightGrey',
        borderColor: '$lightGrey',
        borderBottomColor: '$red',
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
    footer: {
        alignItems: 'center',
        marginBottom: AppSizes.padding,
    },
});

export default styles;
