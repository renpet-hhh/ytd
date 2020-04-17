module.exports = {
	root: true,
	extends: [
		'@react-native-community',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:prettier/recommended',
		'prettier/@typescript-eslint',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['*.js'],
	parserOptions: {
		project: './tsconfig.json',
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {
		'@typescript-eslint/explicit-function-return-type': ["error", {
			allowExpressions: true
		}],
		'prettier/prettier': "warn"
	}
};
