import StyleService from '@services/StyleService';

import { AppStyles } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    inputText: {
        fontSize: AppStyles.p.fontSize,
        fontFamily: AppStyles.pbold.fontFamily,
        textAlign: 'center',
    },
});

export default styles;
