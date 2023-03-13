import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    accountRow: {
        paddingRight: 20,
        paddingLeft: 20,
        paddingTop: 6,
        paddingBottom: 6,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(60) / 4,
        borderWidth: 1,
        borderColor: '$lightBlue',
        backgroundColor: '$tint',
    },
    iconInfo: {
        tintColor: '$grey',
        marginRight: 5,
    },
    iconAccount: {
        marginRight: 15,
        tintColor: '$contrast',
    },
});
