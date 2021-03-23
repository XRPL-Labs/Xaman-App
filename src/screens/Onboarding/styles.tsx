import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: '$background' },
    backgroundImageStyle: {
        height: AppSizes.screen.height,
        opacity: StyleService.isDarkMode() ? 0.04 : 0.02,
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
});

export default styles;
