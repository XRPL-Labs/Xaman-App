import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        marginTop: AppSizes.padding,
        marginHorizontal: AppSizes.paddingSml,
    },
    trustLineInfoIcon: {
        tintColor: '$grey',
        marginRight: 5,
    },
});
