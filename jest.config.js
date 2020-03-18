const { defaults: tsJestConfig } = require('ts-jest/presets');

module.exports = {
    ...tsJestConfig,
    preset: 'react-native',
    timers: 'fake',
    transformIgnorePatterns: ['node_modules/(?!react-native|@react-native-community|realm)'],
    setupFiles: ['./jest.setup.js'],
    collectCoverage: true,
    globals: {
        window: {},
        'ts-jest': {
            babelConfig: false,
            tsConfig: 'tsconfig.jest.json',
        },
    },
    transform: {
        '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest',
        '\\.(ts|tsx)$': 'ts-jest',
    },
    testMatch: ['**/__tests__/**/?(*.)+(spec|test).(js|ts|tsx)'],
    testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
    cacheDirectory: '.jest/cache',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'ios.ts', 'ios.tsx', 'android.ts', 'android.tsx'],
};
