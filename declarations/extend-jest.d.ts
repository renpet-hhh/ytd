declare namespace jest {
	interface Matchers<R> {
		toHaveStyleRule: import('node_modules/jest-styled-components/typings').jest.Matchers<
			R
		>['toHaveStyleRule'];
	}
}
