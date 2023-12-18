import StyleService from '@services/StyleService';

import { AppSizes, AppStyles } from '@theme';

export default StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$background',
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    contentArea: {
        paddingHorizontal: AppStyles.paddingHorizontalSml.paddingHorizontal,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: '$lightBlue',
    },
});
