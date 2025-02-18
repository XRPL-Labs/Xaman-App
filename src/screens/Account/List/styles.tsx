import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowContainer: {
        width: AppSizes.screen.width * 0.9,
        height: AppSizes.scale(110),
        paddingLeft: AppSizes.paddingSml / 1.3,
        paddingRight: AppSizes.paddingSml / 2,
        paddingVertical: AppSizes.paddingSml / 1.8,
        borderWidth: 2,
        borderColor: '$tint',
        borderRadius: 14,
        marginHorizontal: 20,
        backgroundColor: '$background',
    },
    hasProBorder: {
        borderColor: '#ffcc00',
        backgroundColor: '#FDEFA6',
    },
    rowAddContainer: {
        marginBottom: 10,
        height: AppSizes.scale(90),
        paddingTop: 5,
        paddingBottom: 15,
        // borderWidth: 2,
        // borderColor: '$tint',
        // borderRadius: 15,
        marginHorizontal: 20,
        backgroundColor: '$background',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowMigrationContainer: {
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '$blue',
        borderRadius: 15,
        marginHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '$lightBlue',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowHeader: {
        paddingTop: 0,
        // paddingBottom: 15,
        // borderBottomWidth: 1,
        // borderBottomColor: '$tint',
        paddingRight: 0,
    },
    buttonEditIcon: {
        tintColor: '$textPrimary',
        marginLeft: 10,
    },
    proBadge: {
        position: 'absolute',
        right: -3,
        bottom: -2,
    },
    buttonEditText: {
        // color: '$textPrimary',
    },
    reorderIcon: {
        tintColor: '$grey',
    },
    rowText: {
        color: '$blue',
    },
    subRow: {
        // paddingTop: 14,
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        paddingHorizontal: AppSizes.paddingSml / 1.3,
        paddingBottom: 13,
    },
    subLabel: {
        paddingBottom: 3,
        lineHeight: 20,
    },
    accountLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        lineHeight: AppFonts.p.size * 1.4,
        color: '$textPrimary',
    },
    accountLabelDark: {
        color: '$dark',
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
        lineHeight: AppFonts.base.size * 1,
        color: '$grey',
        includeFontPadding: false,
    },
});

export default styles;
