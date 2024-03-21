import StyleService from '@services/StyleService';

import Fonts from '@theme/fonts';

/* Styles ==================================================================== */
const styles = StyleService.create({
    label: {
        marginLeft: 5,
        marginBottom: 5,
        fontFamily: Fonts.base.familyBold,
        fontSize: Fonts.subtext.size,
        color: '$grey',
    },
});

export default styles;
