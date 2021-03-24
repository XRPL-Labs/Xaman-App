import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        height: AppSizes.moderateScale(400),
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '$tint',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    declineButton: {
        backgroundColor: '$red',
    },
});

export default styles;
