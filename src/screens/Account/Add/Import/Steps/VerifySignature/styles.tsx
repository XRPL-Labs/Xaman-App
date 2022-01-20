import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    headerImage: {
        width: AppSizes.scale(180),
        height: AppSizes.scale(180),
        alignSelf: 'center',
    },
});

export default styles;
