const { defaults: tsJestConfig } = require('ts-jest/presets');

module.exports = {
    ...tsJestConfig,
    preset: 'react-native',
    transformIgnorePatterns: [
        'node_modules/(?!react-native|@react-native|@react-native-community|realm|@react-native-firebase|i18n-js)',
    ],
    setupFiles: ['./jest.setup.js'],
    collectCoverage: true,
    coverageReporters: ['lcov'],
    globals: {
        window: {},
        'ts-jest': {
            tsJestConfig: {
                allowJs: true,
            },
        },
    },
    transform: {
        '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest',
        '\\.(ts|tsx)$': [
            'ts-jest',
            {
                babelConfig: false,
                isolatedModules: true,
                tsconfig: 'tsconfig.jest.json',
            },
        ],
    },
    testMatch: ['**/__tests__/**/?(*.)+(spec|test).(js|ts|tsx)'],
    testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
    cacheDirectory: '.jest/cache',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'ios.ts', 'ios.tsx', 'android.ts', 'android.tsx'],
    maxWorkers: 1,
    testTimeout: 20000,
    moduleNameMapper: {
        // Jest does not support package.json exports.
        uuid: require.resolve('uuid'),
        '@realm/fetch': require.resolve('@realm/fetch'),
    },
};
