import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

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
    containerFailed: {
        backgroundColor: '$lightRed',
    },
    containerVerificationFailed: {
        backgroundColor: '$lightOrange',
    },
    containerSigned: {
        backgroundColor: '$lightBlue',
    },
    successImage: {
        alignSelf: 'center',
        width: AppSizes.scale(300),
        height: AppSizes.scale(300),
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
    appTitle: {
        fontSize: AppFonts.pb.size,
        fontFamily: AppFonts.pb.family,
        marginTop: 15,
        marginBottom: 15,
        color: '$textPrimary',
    },
});

export default styles;
