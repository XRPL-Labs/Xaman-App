import Realm from 'realm';
/**
 * Custom Node Model
 */
class CustomNode extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'CustomNode',
        properties: {
            endpoint: { type: 'string' },
            name: { type: 'string' },
            explorerTx: { type: 'string' },
            explorerAccount: { type: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public endpoint: string;
    public name: string;
    public explorerTx: string;
    public explorerAccount: string;
    public registerAt?: Date;
    public updatedAt?: Date;
}

export default CustomNode;
