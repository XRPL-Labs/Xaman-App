import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
    },
    label: {
        marginLeft: 5,
        marginBottom: 5,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$grey',
    },
});

export default styles;
