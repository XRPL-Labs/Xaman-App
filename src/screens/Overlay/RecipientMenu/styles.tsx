import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderColor: '$tint',
        borderWidth: 1,
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    button: {
        backgroundColor: '$grey',
        height: AppSizes.scale(50),
        borderRadius: AppSizes.scale(50) / 2,
    },
});

export default styles;
