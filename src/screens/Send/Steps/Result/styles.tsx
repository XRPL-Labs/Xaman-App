import StyleService from '@services/StyleService';
import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    containerSuccess: {
        backgroundColor: '$background',
    },
    containerVerificationFailed: {
        backgroundColor: '$lightOrange',
    },
    containerFailed: {
        backgroundColor: '$lightRed',
    },
    successImage: {
        alignSelf: 'center',
        width: AppSizes.scale(300),
        height: AppSizes.scale(300),
        resizeMode: 'contain',
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: '$tint',
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
});

export default styles;
