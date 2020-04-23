import React from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent, ToastAndroid } from 'react-native';
import colors from 'src/constants/colors';
import IconButton from './IconButton';
import _ from 'lodash';
import { zIndex } from 'src/constants/zIndex';

interface Props {
	icons: string[];
	descriptions?: string[];
	onPress: ((ev: GestureResponderEvent) => void)[];
	onClear: (ev: GestureResponderEvent) => void;
	visible: boolean;
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.BLACK,
		width: Dimensions.get('window').width,
		position: 'absolute',
		top: 0,
		flexDirection: 'row',
		zIndex: zIndex.SELECT_MENU,
	},
	listContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	icon: {
		fontSize: 32,
		padding: 16,
		color: colors.GOLD,
	},
	iconButton: {
		justifyContent: 'center',
	},
});
function returnTrue(): boolean {
	return true;
}
const Item = React.memo(
	({
		icons,
		onPress,
		i,
		descriptions,
	}: Pick<Props, 'icons' | 'onPress' | 'descriptions'> & { i: number }): JSX.Element => {
		return (
			<IconButton
				name={icons[i]}
				onPress={onPress[i]}
				onLongPress={
					descriptions?.[i]
						? () => ToastAndroid.show(descriptions[i], ToastAndroid.SHORT)
						: undefined
				}
				delayLongPress={200}
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
const SelectMenu = ({
	icons,
	onPress,
	onClear,
	visible,
	descriptions,
}: Props): JSX.Element | null => {
	if (!visible) return null;
	if (icons.length !== onPress.length) {
		throw Error('Each icon must receive a handler');
	}
	if (new Set(icons).size !== icons.length) {
		throw Error('Duplicate icons are not allowed');
	}
	const iconListJSX = icons.map((icon, i) => (
		<Item descriptions={descriptions} icons={icons} onPress={onPress} i={i} key={icon} />
	));
	return (
		<View onStartShouldSetResponder={returnTrue} style={styles.container}>
			<IconButton
				style={styles.iconButton}
				iconStyle={styles.icon}
				onLongPress={() => ToastAndroid.show('Cancel', ToastAndroid.SHORT)}
				name="clear"
				onPress={onClear}
				testID="clear-icon"
			/>
			<View style={styles.listContainer}>{iconListJSX}</View>
		</View>
	);
};

export default React.memo(SelectMenu, _.isEqual.bind(_));
