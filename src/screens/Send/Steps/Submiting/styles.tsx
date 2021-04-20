import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: '$background',
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: '$tint',
        opacity: 0.5,
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
});

export default styles;
