import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        padding: AppSizes.paddingSml,
        backgroundColor: '$background',
    },

    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
        alignItems: 'center',
    },
    actionDescription: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$contrast',
    },
    infoIcon: {
        tintColor: '$orange',
    },
    messageContainer: {
        backgroundColor: StyleService.select({
            light: '$lightGrey',
            dark: '$black',
        }),
        borderWidth: StyleService.select({ light: 0, dark: 1 }),
        borderColor: '$tint',
    },
    backgroundShapes: {
        resizeMode: 'contain',
        opacity: StyleService.select({
            light: 0.4,
            dark: 0.2,
        }),
    },
});

export default styles;
