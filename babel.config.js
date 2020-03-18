module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
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
                    dgram: 'react-native-udp',
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
    ],
    env: {
        production: {
            plugins: ['transform-remove-console'],
        },
    },
};
