import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexGrow: 0,
        flexDirection: 'row',
        paddingVertical: AppSizes.paddingSml,
    },
    contentContainer: {},
    button: {
        borderRadius: AppSizes.scale(75) / 10,
        marginRight: AppSizes.paddingExtraSml,
    },
    buttonText: {
        fontWeight: '400',
    },
});
