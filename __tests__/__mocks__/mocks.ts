import { StackNavigationProp } from '@react-navigation/stack';

export const navigation: StackNavigationProp<import('src/types/navigation').Routes, 'Home'> = {
	addListener: jest.fn(),
	canGoBack: jest.fn(),
	dangerouslyGetParent: jest.fn(),
	dangerouslyGetState: jest.fn(),
	dispatch: jest.fn(),
	goBack: jest.fn(),
	isFocused: jest.fn(),
	navigate: jest.fn(),
	pop: jest.fn(),
	popToTop: jest.fn(),
	push: jest.fn(),
	removeListener: jest.fn(),
	replace: jest.fn(),
	reset: jest.fn(),
	setOptions: jest.fn(),
	setParams: jest.fn(),
};
