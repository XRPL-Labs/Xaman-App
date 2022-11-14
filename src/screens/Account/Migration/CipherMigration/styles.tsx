import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowContainer: {
        width: AppSizes.screen.width * 0.9,
        height: AppSizes.scale(120),
        borderWidth: 2,
        borderColor: '$tint',
        borderRadius: 20,
        marginBottom: 20,
        backgroundColor: '$background',
    },
    rowContent: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
    },
    rowFade: {
        flex: 1,
        opacity: 0.5,
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: '$tint',
        zIndex: 99999,
    },
    rowHeader: {
        paddingTop: 0,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '$tint',
        paddingRight: 0,
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
    doneButton: {
        backgroundColor: '$green',
    },
});

export default styles;
