import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        // backgroundColor: '$background',
        top: 0,
        bottom: 0,
    },
    backgroundImageStyle: {
        position: 'absolute', // this + 0000 needed for fold / square screen
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    },
    logo: {
        // marginTop: AppSizes.screen.height * 0.05,
        width: AppSizes.screen.width * 0.5,
        height: AppSizes.screen.height * 0.2,
        resizeMode: 'contain',
    },
});

export default styles;
