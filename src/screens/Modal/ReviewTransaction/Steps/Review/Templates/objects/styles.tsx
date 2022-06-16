import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    contentBox: {
        marginBottom: AppSizes.paddingSml,
        paddingHorizontal: 5,
    },
    addressContainer: {
        backgroundColor: '$lightGrey',
        marginBottom: AppSizes.paddingSml,
    },
    label: {
        fontFamily: AppFonts.small.family,
        fontSize: AppFonts.small.size,
        fontWeight: 'bold',
        color: '$grey',
        paddingLeft: 5,
        marginBottom: 10,
    },
    amount: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    value: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
});

export default styles;
