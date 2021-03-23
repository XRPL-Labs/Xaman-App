import StyleService from '@services/StyleService';
import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { position: 'relative', flex: 1, flexDirection: 'column' },
    rowContainer: {
        width: '100%',
        paddingVertical: AppSizes.paddingSml,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '$background',
        borderBottomWidth: 1,
        borderColor: '$tint',
    },
    checkIcon: {
        tintColor: '$blue',
    },
    sectionHeader: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '$lightGrey',
    },
    sectionHeaderText: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyExtraBold,
        color: '$blue',
    },
    searchContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: 15,
    },
});

export default styles;
