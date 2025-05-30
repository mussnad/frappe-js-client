const globals = require('globals')
const pluginJs = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]
