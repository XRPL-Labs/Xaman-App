import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        // backgroundColor: '$background',
    },
    backgroundImageStyle: {
        height: AppSizes.screen.height,
        // opacity: StyleService.isDarkMode() ? 0.04 : 0.02,
    },
    logo: {
        // marginTop: AppSizes.screen.height * 0.05,
        width: AppSizes.screen.width * 0.5,
        height: AppSizes.screen.height * 0.2,
        resizeMode: 'contain',
    },
});

export default styles;
