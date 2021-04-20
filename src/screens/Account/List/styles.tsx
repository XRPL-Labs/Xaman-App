import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowContainer: {
        width: AppSizes.screen.width * 0.9,
        height: AppSizes.scale(130),
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        borderWidth: 2,
        borderColor: '$tint',
        borderRadius: 20,
        marginHorizontal: 20,
        backgroundColor: '$background',
    },
    rowAddContainer: {
        height: AppSizes.scale(90),
        borderWidth: 2,
        borderColor: '$tint',
        borderRadius: 15,
        marginHorizontal: 20,
        backgroundColor: '$background',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowHeader: {
        paddingTop: 0,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '$tint',
        paddingRight: 0,
    },
    buttonEditIcon: {
        tintColor: '$textPrimary',
        marginLeft: 10,
    },
    buttonEditText: {
        color: '$textPrimary',
    },
    reorderIcon: {
        tintColor: '$grey',
    },
    rowText: {
        color: '$blue',
    },
    subRow: {
        paddingTop: 12,
    },
    subLabel: {
        paddingBottom: 5,
    },
    accountLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    accessLevelContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: 3,
    },
    accessLevelLabel: {
        marginLeft: 5,
        fontSize: AppFonts.base.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
        color: '$grey',
        includeFontPadding: false,
    },
});

export default styles;
