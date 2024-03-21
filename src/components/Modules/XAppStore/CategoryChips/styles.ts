import StyleService from '@services/StyleService';
import { AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flex: 1,
        gap: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    containerActive: {
        flexDirection: 'row',
        paddingBottom: AppSizes.paddingExtraSml,
    },
});
