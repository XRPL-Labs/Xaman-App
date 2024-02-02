module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        [
            'rewrite-require',
            {
                aliases: {
                    fs: 'node-libs-browser/mock/empty',
                    path: 'path-browserify',
                    crypto: 'crypto-browserify',
                    net: 'node-libs-browser/mock/net',
                    http: 'stream-http',
                    https: 'https-browserify',
                    tls: 'node-libs-browser/mock/tls',
                    zlib: 'browserify-zlib',
                    vm: 'vm-browserify',
                    stream: 'stream-browserify',
                    _stream_duplex: 'readable-stream/duplex',
                    _stream_passthrough: 'readable-stream/passthrough',
                    _stream_readable: 'readable-stream/readable',
                    _stream_transform: 'readable-stream/transform',
                    _stream_writable: 'readable-stream/writable',
                },
                throwForNonStringLiteral: true,
            },
        ],
        [
            '@babel/plugin-transform-runtime',
            {
                helpers: true,
                regenerator: false,
            },
        ],
        [
            'module-resolver',
            {
                root: ['./src'],
                extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                alias: {
                    '@components': ['./src/components'],
                    '@common': ['./src/common'],
                    '@locale': ['./src/locale'],
                    '@screens': ['./src/screens'],
                    '@services': ['./src/services'],
                    '@store': ['./src/store'],
                    '@theme': ['./src/theme'],
                },
            },
        ],
        ['@babel/plugin-transform-flow-strip-types', { allowDeclareFields: true }],
    ],
    env: {
        production: {
            plugins: ['transform-remove-console'],
        },
    },
};
