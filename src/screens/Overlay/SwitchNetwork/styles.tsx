import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    networkRow: {
        paddingRight: 20,
        paddingLeft: 13,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: 10,
        borderRadius: 18,
        backgroundColor: '$tint',
    },
    networkLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        color: '$silver',
    },
    networkLabelSelected: {
        color: '$contrast',
    },
    networkNodeText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: '$silver',
        marginTop: 2,
        marginLeft: 2,
    },
    networkTypeLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size * 0.85,
        color: '$textPrimary',
        paddingTop: AppSizes.paddingExtraSml,
        paddingBottom: AppSizes.paddingSml,
    },
    networkNodeTextSelected: {
        color: '$grey',
    },
    radioCircle: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: 3,
        borderColor: '$grey',
        borderRadius: 100,
    },
    radioCircleSelected: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: AppSizes.scale(6),
        borderColor: '$blue',
        borderRadius: 100,
        backgroundColor: '$background',
    },
    networkColorCircle: {
        height: AppSizes.scale(18),
        width: AppSizes.scale(18),
        borderRadius: AppSizes.scale(18) / 2,
        marginRight: AppSizes.paddingSml,
    },
});

export default styles;
