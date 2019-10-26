const license = require('rollup-plugin-license');

export default {
    input: 'dist/Alloy.js',
    output: {
        file: `bundle/alloy-${process.env.VERSION}.js`,
        format: 'umd',
        name: 'alloy'
    },
    plugins: [
        license({
            banner: {
                commentStyle: 'ignored',
                content: { file: 'LICENSE' }
            }
        })
    ]
}