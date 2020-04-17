import React from 'react';
import { render, RenderAPI, fireEvent } from 'react-native-testing-library';
import SelectMenu from 'src/components/generic/SelectMenu';

let wrapper: RenderAPI;
let onAdd: jest.Mock, onDelete: jest.Mock, onClear: jest.Mock;

beforeEach(() => {
	onAdd = jest.fn();
	onDelete = jest.fn();
	onClear = jest.fn();

	wrapper = render(
		<SelectMenu
			icons={['add', 'delete']}
			onPress={[onAdd, onDelete]}
			onClear={onClear}
			visible={true}
		/>,
	);
});

it('renders correct number of icons', () => {
	const { getAllByTestId } = wrapper;
	expect(getAllByTestId('custom-icon')).toHaveLength(2);
	expect(getAllByTestId('clear-icon')).toHaveLength(1);
});

it('gets invisible when specified', () => {
	const { queryAllByTestId } = render(
		<SelectMenu
			onClear={() => null}
			visible={false}
			icons={['add', 'delete']}
			onPress={[() => null, () => null]}
		/>,
	);
	expect(queryAllByTestId('custom-icon')).toHaveLength(0);
	expect(queryAllByTestId('clear-icon')).toHaveLength(0);
});

describe('handlers', () => {
	it('onPress is called for each icon', () => {
		const icons = wrapper.getAllByTestId('custom-icon');
		icons.forEach(icon => {
			fireEvent.press(icon);
		});
		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});
	it('onClear is called', () => {
		const clear = wrapper.getByTestId('clear-icon');
		fireEvent.press(clear);
		expect(onClear).toHaveBeenCalledTimes(1);
	});
});
