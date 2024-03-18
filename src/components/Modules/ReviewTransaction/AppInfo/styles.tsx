import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
    },
    appTitle: {
        fontSize: AppFonts.pb.size,
        fontFamily: AppFonts.pb.family,
        marginTop: 15,
        marginBottom: 15,
        color: '$textPrimary',
    },
    transactionTypeLabel: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.select({ light: '$blue', dark: '$white' }),
    },
    transactionTypeContainer: {
        backgroundColor: '$lightGrey',
        padding: 5,
        borderRadius: AppSizes.borderRadius,
    },
    descriptionLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.subtext.family,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 3,
        color: '$textPrimary',
    },
    instructionText: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.subtext.family,
        color: '$textPrimary',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    fallbackIconContainer: {
        backgroundColor: '$purple',
        borderRadius: AppSizes.borderRadius,
        padding: 5,
    },
});

export default styles;
