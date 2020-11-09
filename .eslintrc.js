'use strict';

module.exports = {
	root: true,
	env: {
		node: true,
		es6: true,
		es2020: true
	},
	extends: ['eslint:recommended'],
	rules: {
		'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
		'prettier/prettier': 'warn',
		'no-empty': ['error', { allowEmptyCatch: true }]
	},
	plugins: ['prettier'],
	parserOptions: {
		parser: '@typescript-eslint/parser'
	}
};
