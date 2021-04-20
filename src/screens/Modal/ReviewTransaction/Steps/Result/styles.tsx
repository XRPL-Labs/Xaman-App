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
        backgroundColor: '$lightGreen',
    },
    containerFailed: {
        backgroundColor: '$lightRed',
    },
    containerSigned: {
        backgroundColor: '$lightBlue',
    },
    successImage: {
        alignSelf: 'center',
        width: AppSizes.scale(250),
        height: AppSizes.scale(250),
        resizeMode: 'contain',
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: '$background',
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
});

export default styles;
