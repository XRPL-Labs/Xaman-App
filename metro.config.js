/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const { resolve } = require('path');
const fs = require('fs');
const modulePaths = require('./packager/modulePaths');

// module.exports = {
//     transformer: {
//         getTransformOptions: async () => ({
//             transform: {
//                 experimentalImportSupport: false,
//                 inlineRequires: false,
//             },
//         }),
//     },
// };

const config = {
    transformer: {
        getTransformOptions: () => {
            const moduleMap = {};
            modulePaths.forEach((path) => {
                if (fs.existsSync(path)) {
                    moduleMap[resolve(path)] = true;
                }
            });
            return {
                preloadedModules: moduleMap,
                transform: { inlineRequires: { blacklist: moduleMap } },
            };
        },
    },
};

module.exports = config;
