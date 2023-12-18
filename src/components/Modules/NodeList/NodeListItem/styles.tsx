import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingExtraSml,
        marginHorizontal: AppSizes.paddingExtraSml,
        marginVertical: AppSizes.paddingExtraSml,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '$background',
    },
    selected: {
        backgroundColor: '$lightBlue',
        borderRadius: AppSizes.borderRadius,
    },
    url: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    urlSelected: {
        color: StyleService.select({ light: '$blue', dark: '$light' }),
    },
    dot: {
        height: 20,
        width: 20,
        borderRadius: 12,
        borderWidth: 1.3,
        borderColor: '$silver',
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotSelected: {
        borderColor: '$blue',
        borderWidth: 3,
    },
});

export default styles;
