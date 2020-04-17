import React from 'react';
import {
	render,
	waitForElement,
	fireEvent,
	RenderAPI,
	GetByAPI,
} from 'react-native-testing-library';
import BuildSelectableList from 'src/components/high-order/SelectableList';
import { Text, View } from 'react-native';
import useMultiselect from 'src/hooks/useMultiselect';
import { flush, act } from '__tests__/utils';

class Test {
	// default initialization
	getData = (): Promise<Record<string, number>> => {
		return Promise.resolve({ a: 2, b: 4, c: 5, d: 3, e: 8 });
	};
	dataToText = (key: string, data: number): string => data.toString();
	list = BuildSelectableList({
		getData: this.getData,
		dataToText: this.dataToText,
	}); // initialized only for the type to be available
	constructor(args?: {
		getData?: () => Promise<Record<string, number>>;
		dataToText?: (key: string, data: number) => string;
	}) {
		if (args?.getData) this.getData = args.getData;
		if (args?.dataToText) this.dataToText = args.dataToText;
		this.list = BuildSelectableList({
			getData: this.getData,
			dataToText: this.dataToText,
		});
	}
}

const dummyList__ = new Test().list;
type ListType = typeof dummyList__;

describe('renders', () => {
	it('the specified component when empty', async () => {
		const List = new Test({
			getData: () =>
				new Promise(res => {
					setTimeout(() => res({}), 5);
				}),
		}).list;
		const { getAllByText } = render(
			<View>
				<List renderWhenEmpty={<Text>Hey</Text>} />
			</View>,
		);
		await act(async () => {
			await waitForElement(() => getAllByText('Hey'));
		});
		expect(getAllByText('Hey')).toHaveLength(1);
	});

	it('the data correctly', async () => {
		const List = new Test().list;
		const { queryAllByText, getByText } = render(
			<View>
				<List />
			</View>,
		);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		expect(queryAllByText('2')).toHaveLength(1);
		expect(queryAllByText('4')).toHaveLength(1);
		expect(queryAllByText('5')).toHaveLength(1);
		expect(queryAllByText('3')).toHaveLength(1);
		expect(queryAllByText('8')).toHaveLength(1);
		expect(queryAllByText('7')).toHaveLength(0);
	});

	it('repeated data correctly', async () => {
		const getData = (): Promise<Record<string, number>> =>
			Promise.resolve({ a: 1, b: 1, c: 2, d: 3, e: 2 });
		const List = new Test({ getData }).list;
		const { queryAllByText, getAllByText } = render(
			<View>
				<List />
			</View>,
		);
		await act(async () => {
			await waitForElement(() => getAllByText('1'));
		});
		expect(queryAllByText('1')).toHaveLength(2);
		expect(queryAllByText('2')).toHaveLength(2);
		expect(queryAllByText('3')).toHaveLength(1);
	});
	it('no icons when leftIcon and rightIcon are not specified', async () => {
		const List = new Test().list;
		const { queryAllByTestId, getByText } = render(<List />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		expect(queryAllByTestId('left-icon')).toHaveLength(0);
		expect(queryAllByTestId('right-icon')).toHaveLength(0);
	});
	it('left icon when specified', async () => {
		const List = new Test().list;
		const { queryAllByTestId, getByText } = render(<List leftIcon="delete" />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		expect(queryAllByTestId('left-icon')).toHaveLength(5);
		expect(queryAllByTestId('right-icon')).toHaveLength(0);
	});
	it('right icon when specified', async () => {
		const List = new Test().list;
		const { queryAllByTestId, getByText } = render(<List rightIcon="delete" />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		expect(queryAllByTestId('left-icon')).toHaveLength(0);
		expect(queryAllByTestId('right-icon')).toHaveLength(5);
	});
	it('both icons when specified', async () => {
		const List = new Test().list;
		const { queryAllByTestId, getByText } = render(
			<List leftIcon="drag-handle" rightIcon="delete" />,
		);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		expect(queryAllByTestId('left-icon')).toHaveLength(5);
		expect(queryAllByTestId('right-icon')).toHaveLength(5);
	});
});

describe('touch handlers', () => {
	let List: ListType;
	let onPress: jest.Mock, onSelect: jest.Mock;
	let Parent: () => JSX.Element;
	beforeEach(() => {
		List = new Test().list;
		onPress = jest.fn();
		onSelect = jest.fn();
		Parent = () => {
			const [selected, , onSelectChange] = useMultiselect<string>();
			// onSelectChange changes in rerenders, so we must catch all calls to it
			// using a wrapper that's being spied on
			onSelect.mockImplementation(onSelectChange);
			return <List onPress={onPress} onSelect={onSelect} selected={selected} />;
		};
	});
	it('allow to press and not select (on press)', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent.press(getByText('2'));
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenNthCalledWith(1, 'a', 2, 0);
		expect(onSelect).not.toHaveBeenCalled();
	});
	it('allow to select and not to press (on long press)', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress');
		await flush();
		expect(onPress).not.toHaveBeenCalled();
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenLastCalledWith('a', 2, 0);
	});
	it('allow to select on press after multiselect mode is active', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress');
		await flush();
		// we expect that the multiselect mode is active now
		fireEvent.press(getByText('3'));
		await flush();
		expect(onSelect).toHaveBeenCalledTimes(2);
		expect(onSelect).toHaveBeenNthCalledWith(1, 'a', 2, 0);
		expect(onSelect).toHaveBeenNthCalledWith(2, 'd', 3, 3);
		expect(onPress).not.toHaveBeenCalled();
	});
	it('allow to select on long press after multiselect mode is active', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress');
		await flush();
		// we expect that the multiselect mode is active now
		fireEvent(getByText('3'), 'longPress');
		await flush();
		expect(onSelect).toHaveBeenCalledTimes(2);
		expect(onSelect).toHaveBeenNthCalledWith(1, 'a', 2, 0);
		expect(onSelect).toHaveBeenNthCalledWith(2, 'd', 3, 3);
		expect(onPress).not.toHaveBeenCalled();
	});
	it('a long press when multimode is active keeps it active', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress');
		await flush();
		// we expect that the multiselect mode is active now
		fireEvent(getByText('3'), 'longPress');
		await flush();
		// we expect that multiselect mode was not changed by the last long press
		fireEvent.press(getByText('5'));
		await flush();
		expect(onSelect).toHaveBeenCalledTimes(3);
		expect(onSelect).toHaveBeenLastCalledWith('c', 5, 2);
		expect(onPress).not.toHaveBeenCalled();
	});
	it('multimode is not active after the only element selected is diselected', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress');
		await flush();
		// we expect that the multiselect mode is active now
		fireEvent.press(getByText('2'));
		await flush();
		// we expect that the multiselect mode is not active now
		fireEvent.press(getByText('3'));
		expect(onSelect).toHaveBeenCalledTimes(2);
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenLastCalledWith('d', 3, 3);
	});
	it('multimode stays active after some element is diselected until all are diselected', async () => {
		const { getByText } = render(<Parent />);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		fireEvent(getByText('2'), 'longPress'); // select 2
		await flush();
		// we expect that the multiselect mode is active now
		fireEvent.press(getByText('3')); // select 3
		await flush();
		fireEvent.press(getByText('2')); // diselect 2
		await flush();
		// we expect that the multiselect mode is still active
		fireEvent.press(getByText('2')); // we expect this to select 2
		await flush();
		expect(onSelect).toHaveBeenCalledTimes(4);
		expect(onSelect).toHaveBeenNthCalledWith(1, 'a', 2, 0);
		expect(onSelect).toHaveBeenNthCalledWith(2, 'd', 3, 3);
		expect(onSelect).toHaveBeenNthCalledWith(3, 'a', 2, 0);
		expect(onSelect).toHaveBeenNthCalledWith(4, 'a', 2, 0);
		expect(onPress).not.toHaveBeenCalled();

		fireEvent.press(getByText('2')); // diselect 2
		await flush();
		fireEvent.press(getByText('3')); // diselect 3
		await flush();
		// no element is selected, we expect multimode not to be active
		fireEvent.press(getByText('5')); // we expect this to press 5
		await flush();
		expect(onSelect).toHaveBeenCalledTimes(6); // not called for 5
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenLastCalledWith('c', 5, 2);
	});
});

describe('styles', () => {
	let List: ListType;
	let getByText: GetByAPI['getByText'], toJSON: RenderAPI['toJSON'];
	const textStyle = { color: 'red' };
	const textContainerStyle = { backgroundColor: 'green' };
	const selectedTextStyle = { color: 'orange' };
	const selectedTextContainerStyle = { backgroundColor: 'blue' };

	beforeEach(async done => {
		List = new Test().list;
		const Parent = (): JSX.Element => {
			const [selected, , onSelectChange] = useMultiselect<string>();
			return (
				<List
					selected={selected}
					onSelect={onSelectChange}
					textStyle={textStyle}
					textContainerStyle={textContainerStyle}
					selectedTextStyle={selectedTextStyle}
					selectedTextContainerStyle={selectedTextContainerStyle}
				/>
			);
		};
		const wrapper = render(<Parent />);
		getByText = wrapper.getByText;
		toJSON = wrapper.toJSON.bind(wrapper);
		await act(async () => {
			await waitForElement(() => getByText('2'));
		});
		done();
	});
	it('are applied', () => {
		expect(toJSON()).toMatchInlineSnapshot(`
		Array [
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        2
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        4
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        5
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        3
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        8
		      </Text>
		    </View>
		  </View>,
		]
	`);
	});
	it("that are exclusive for selected elements are applied when they're selected", async () => {
		fireEvent(getByText('2'), 'longPress');
		await flush();
		expect(toJSON()).toMatchInlineSnapshot(`
		Array [
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          Object {
		            "backgroundColor": "blue",
		          },
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            Object {
		              "color": "orange",
		            },
		          ]
		        }
		      >
		        2
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        4
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        5
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        3
		      </Text>
		    </View>
		  </View>,
		  <View
		    accessible={true}
		    focusable={true}
		    onClick={[Function]}
		    onResponderGrant={[Function]}
		    onResponderMove={[Function]}
		    onResponderRelease={[Function]}
		    onResponderTerminate={[Function]}
		    onResponderTerminationRequest={[Function]}
		    onStartShouldSetResponder={[Function]}
		    style={
		      Object {
		        "opacity": 1,
		      }
		    }
		  >
		    <View
		      style={
		        Array [
		          Object {
		            "alignItems": "center",
		            "flexDirection": "row",
		            "justifyContent": "space-evenly",
		          },
		          Object {
		            "backgroundColor": "green",
		          },
		          null,
		        ]
		      }
		    >
		      <Text
		        style={
		          Array [
		            Object {
		              "color": "#C4C6C8",
		              "flex": 1,
		              "fontSize": 12,
		            },
		            Object {
		              "color": "red",
		            },
		            null,
		          ]
		        }
		      >
		        8
		      </Text>
		    </View>
		  </View>,
		]
	`);
	});
});

describe('icons', () => {
	let wrapper: RenderAPI;
	let leftIconOnPress: jest.Mock,
		leftIconOnLongPress: jest.Mock,
		rightIconOnPress: jest.Mock,
		rightIconOnLongPress: jest.Mock;
	beforeEach(async () => {
		const Parent = new Test().list;
		leftIconOnPress = jest.fn();
		leftIconOnLongPress = jest.fn();
		rightIconOnPress = jest.fn();
		rightIconOnLongPress = jest.fn();
		wrapper = render(
			<Parent
				leftIcon="delete"
				leftIconOnPress={leftIconOnPress}
				leftIconOnLongPress={leftIconOnLongPress}
				rightIcon="delete"
				rightIconOnPress={rightIconOnPress}
				rightIconOnLongPress={rightIconOnLongPress}
			/>,
		);
		await act(async () => {
			await waitForElement(() => wrapper.getByText('2'));
		});
	});
	it('left icon handles press', () => {
		const { getAllByTestId } = wrapper;
		fireEvent.press(getAllByTestId('left-icon')[0]);
		expect(leftIconOnPress).toHaveBeenCalledTimes(1);
		expect(leftIconOnPress).toHaveBeenLastCalledWith('a', 2, 0);
	});
	it('left icon handles long press', () => {
		const { getAllByTestId } = wrapper;
		fireEvent(getAllByTestId('left-icon')[0], 'longPress');
		expect(leftIconOnLongPress).toHaveBeenCalledTimes(1);
		expect(leftIconOnLongPress).toHaveBeenLastCalledWith('a', 2, 0);
	});
	it('right icon handles press', () => {
		const { getAllByTestId } = wrapper;
		fireEvent.press(getAllByTestId('right-icon')[0]);
		expect(rightIconOnPress).toHaveBeenCalledTimes(1);
		expect(rightIconOnPress).toHaveBeenLastCalledWith('a', 2, 0);
	});
	it('right icon handles long press', () => {
		const { getAllByTestId } = wrapper;
		fireEvent(getAllByTestId('right-icon')[0], 'longPress');
		expect(rightIconOnLongPress).toHaveBeenCalledTimes(1);
		expect(rightIconOnLongPress).toHaveBeenLastCalledWith('a', 2, 0);
	});
});
