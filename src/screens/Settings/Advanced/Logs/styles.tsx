import StyleService from '@services/StyleService';
import { AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    listContainer: { padding: 5 },
    logRow: {
        alignSelf: 'stretch',
        paddingBottom: 2,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size * 0.7,
    },
    debug: {
        color: '$textPrimary',
    },
    warn: {
        color: '$orange',
    },
    error: {
        color: '$red',
    },
});

export default styles;
