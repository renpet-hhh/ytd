import React from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent } from 'react-native';
import colors from 'src/constants/colors';
import IconButton from './IconButton';
import _ from 'lodash';

interface Props {
	icons: string[];
	onPress: ((ev: GestureResponderEvent) => void)[];
	onClear: (ev: GestureResponderEvent) => void;
	visible: boolean;
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.DEAD_PURPLE,
		width: Dimensions.get('window').width,
		position: 'absolute',
		top: 0,
		flexDirection: 'row',
	},
	listContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	icon: {
		fontSize: 32,
		padding: 16,
	},
	iconButton: {
		justifyContent: 'center',
	},
	separator: {
		borderRightColor: colors.BROWN,
		borderRightWidth: 0.5,
	},
});
function returnTrue(): boolean {
	return true;
}
const Item = React.memo(
	({ icons, onPress, i }: Pick<Props, 'icons' | 'onPress'> & { i: number }): JSX.Element => {
		return (
			<IconButton
				name={icons[i]}
				onPress={onPress[i]}
				style={styles.iconButton}
				touchableFlex={0}
				iconStyle={styles.icon}
				testID="custom-icon"
				key={icons[i]}
			/>
		);
	},
	_.isEqual.bind(_),
);
const SelectMenu = ({ icons, onPress, onClear, visible }: Props): JSX.Element | null => {
	if (!visible) return null;
	if (icons.length !== onPress.length) {
		throw Error('Each icon must receive a handler');
	}
	if (new Set(icons).size !== icons.length) {
		throw Error('Duplicate icons are not allowed');
	}
	const iconListJSX = icons.map((icon, i) => (
		<Item icons={icons} onPress={onPress} i={i} key={icon} />
	));
	return (
		<View onStartShouldSetResponder={returnTrue} style={styles.container}>
			<IconButton
				style={styles.iconButton}
				iconStyle={styles.icon}
				name="clear"
				onPress={onClear}
				testID="clear-icon"
			/>
			<View style={styles.listContainer}>{iconListJSX}</View>
		</View>
	);
};

export default React.memo(SelectMenu, _.isEqual.bind(_));
