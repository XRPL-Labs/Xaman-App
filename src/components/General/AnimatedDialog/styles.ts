import StyleService from '@services/StyleService';

import { AppSizes, AppStyles } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        alignItems: 'center',
        backgroundColor: '$background',
        borderColor: '$tint',
        borderWidth: 1,
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },
});

export default styles;
