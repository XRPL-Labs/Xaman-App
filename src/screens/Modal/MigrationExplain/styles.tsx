import StyleService from '@services/StyleService';
import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
    headerImageContainer: {
        paddingVertical: AppSizes.padding,
    },
    headerImage: {
        width: AppSizes.scale(280),
        height: AppSizes.scale(120),
        alignSelf: 'center',
    },
});

export default styles;
