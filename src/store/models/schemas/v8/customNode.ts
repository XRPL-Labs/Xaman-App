/**
 * Custom Node Schema
 */

/* Schema  ==================================================================== */
const CustomNodeSchema = {
    schema: {
        name: 'CustomNode',
        properties: {
            endpoint: { type: 'string' },
            name: { type: 'string' },
            explorerTx: { type: 'string' },
            explorerAccount: { type: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default CustomNodeSchema;
