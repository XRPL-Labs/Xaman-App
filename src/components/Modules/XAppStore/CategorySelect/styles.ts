import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        backgroundColor: '$background',
        flexGrow: 0,
        flexDirection: 'row',
        paddingVertical: AppSizes.paddingSml,
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
        zIndex: 9999,
    },
    button: {
        borderRadius: AppSizes.scale(75) / 10,
        marginRight: AppSizes.paddingExtraSml,
    },
    buttonText: {
        fontWeight: '400',
    },
});
