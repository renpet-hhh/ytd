import React from 'react';
import { render } from 'react-native-testing-library';
import Home from 'src/pages/Home';
import { navigation } from '__tests__/__mocks__/mocks';

it('renders', () => {
	render(<Home navigation={navigation} />);
});
