import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    imageProfilePro: {
        resizeMode: 'contain',
        width: AppSizes.scale(200),
        height: AppSizes.scale(200),
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'visible',
    },
    openBetaButton: {
        backgroundColor: '$orange',
        alignSelf: 'stretch',
    },
});

export default styles;
