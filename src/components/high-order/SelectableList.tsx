import React, {
	useImperativeHandle,
	Ref,
	RefAttributes,
	PropsWithoutRef,
	useCallback,
	useRef,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import colors from 'src/constants/colors';
import { Typings, RemoveAcceptCallback } from 'src/types/components';
import IconButton from '../generic/IconButton';
import _ from 'lodash';
import useEventCallback from 'src/hooks/useEventCallback';

const styles = StyleSheet.create({
	line: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
	},
	textInLine: {
		fontSize: 12,
		color: colors.WHITE,
		flex: 1,
	},
	icon: {
		fontSize: 32,
		padding: 8,
	},
});

function returnTrue(): true {
	return true;
}
function returnNull(): null {
	return null;
}
function identity(x: string): string {
	return x;
}

/* React.ForwardRefExoticComponent<PropsWithoutRef<
	Typings<T>['SelectableList']['Props']
> &
	RefAttributes<Typings<T>['SelectableList']['RefMethods']>>*/

const tryToUseAsFunction = <T extends unknown, A extends unknown[]>(
	fn: T | ((...args: A) => T),
	...args: A
): T => {
	return typeof fn === 'function' ? (fn as Function)(...args) : fn;
};
const BuildSelectableList = <T extends unknown>({
	getData,
	dataToText,
}: Typings<T>['SelectableList']['Args']): React.ForwardRefExoticComponent<PropsWithoutRef<
	Typings<T>['SelectableList']['Props']
> &
	RefAttributes<Typings<T>['SelectableList']['RefMethods']>> => {
	type ItemProps = Omit<
		Typings<T>['SelectableList']['ItemProps'],
		keyof Typings<T>['SelectableList']['ItemStyles']
	> &
		RemoveAcceptCallback<Typings<T>['SelectableList']['ItemStyles']> & {
			multiSelectActive: boolean;
			setMultiSelectActive: React.Dispatch<React.SetStateAction<boolean>>;
			index: number;
			id: string;
			elem: T;
			isSelected: boolean;
		};
	const Item = React.memo(
		(props: ItemProps) => {
			const {
				index,
				elem,
				id,
				multiSelectActive,
				onPress,
				onSelect,
				setMultiSelectActive,
				isSelected,
				textStyle,
				selectedTextStyle,
				textContainerStyle,
				selectedTextContainerStyle,
				leftIcon,
				leftIconOnLongPress,
				leftIconOnPress,
				leftIconStyle,
				rightIcon,
				rightIconOnLongPress,
				rightIconOnPress,
				rightIconStyle,
			} = props;
			const onPressHandler = useEventCallback(() => {
				if (multiSelectActive) {
					onSelect?.(id, elem, index);
				} else {
					onPress?.(id, elem, index);
				}
			});
			const onLongPressHandler = useEventCallback(() => {
				onSelect?.(id, elem, index);
				setMultiSelectActive(true);
			});
			const containerStyleProp = [
				styles.line,
				textContainerStyle,
				isSelected ? selectedTextContainerStyle : null,
			];
			const leftIconStyleProp = [styles.icon, leftIconStyle];
			const rightIconStyleProp = [styles.icon, rightIconStyle];
			const leftIconPressHandler = (): void => leftIconOnPress?.(id, elem, index);
			const leftIconLongPressHandler = useEventCallback(() =>
				leftIconOnLongPress?.(id, elem, index),
			);
			const rightIconPressHandler = useEventCallback(() =>
				rightIconOnPress?.(id, elem, index),
			);
			const rightIconLongPressHandler = useEventCallback(() =>
				rightIconOnLongPress?.(id, elem, index),
			);
			const textStyleProp = [
				styles.textInLine,
				textStyle,
				isSelected ? selectedTextStyle : null,
			];
			const text = dataToText(id, elem);
			return (
				<TouchableOpacity
					onPress={onPressHandler}
					onLongPress={onLongPressHandler}
					delayLongPress={400}
					key={id}>
					<View style={containerStyleProp}>
						{leftIcon && (
							<IconButton
								style={styles.line}
								name={leftIcon}
								iconStyle={leftIconStyleProp}
								onPress={leftIconPressHandler}
								onLongPress={leftIconLongPressHandler}
								testID="left-icon"
							/>
						)}
						<Text style={textStyleProp}>{text}</Text>
						{rightIcon && (
							<IconButton
								style={styles.line}
								name={rightIcon}
								iconStyle={rightIconStyleProp}
								onPress={rightIconPressHandler}
								onLongPress={rightIconLongPressHandler}
								testID="right-icon"
							/>
						)}
					</View>
				</TouchableOpacity>
			);
		},
		(prev, next) => {
			return _.isEqual(prev, next);
		},
	);

	return React.forwardRef(
		(
			props: Typings<T>['SelectableList']['Props'],
			ref: Ref<Typings<T>['SelectableList']['RefMethods']>,
		) => {
			/** Warnings */
			if ((props.onSelect && !props.selected) || (!props.onSelect && props.selected)) {
				console.warn(
					"Either specify both onSelect and selected or don't specify any of them",
				);
			}
			if (!(props.filter instanceof Set) && props.keyForData) {
				console.warn("keyForData is ignored because filter isn't a set");
			}
			const EMPTY_SET = useRef(new Set<string>()).current;

			const {
				selected = EMPTY_SET,
				onPress = returnNull,
				onSelect = returnNull,
				filter = returnTrue,
				keyForData = identity,
				textStyle,
				textContainerStyle,
				selectedTextStyle,
				selectedTextContainerStyle,
				renderWhenEmpty,
				leftIcon,
				leftIconStyle,
				leftIconOnPress,
				leftIconOnLongPress,
				rightIcon,
				rightIconStyle,
				rightIconOnPress,
				rightIconOnLongPress,
			} = props;

			const [data, setData] = useState<Record<string, T> | null>(null);
			const [multiSelectActive, setMultiSelectActive] = useState(false);

			const resetMultiselect = (): void => {
				setMultiSelectActive(false);
			};
			const refresh = useCallback(async (): Promise<void> => {
				const updatedData = await getData();
				setData(updatedData);
			}, []);

			useImperativeHandle(
				ref,
				() => ({
					refresh,
					resetMultiselect,
				}),
				[refresh],
			);

			useEffect(() => {
				refresh();
			}, [refresh]);
			useEffect(() => {
				if (selected.size === 0) {
					resetMultiselect();
				}
			}, [selected]);

			if (!data) return null;
			const listJSX: (JSX.Element | null)[] = [];
			if (filter instanceof Set) {
				for (let i = 0; i < filter.size; i++) {
					const key = [...filter][i];
					const dataKey = keyForData(key);
					const elem = data[dataKey];
					const isSelected = selected.has(key);
					const itemStyles = {
						textStyle: tryToUseAsFunction(textStyle, key, elem, i),
						selectedTextStyle: tryToUseAsFunction(selectedTextStyle, key, elem, i),
						textContainerStyle: tryToUseAsFunction(textContainerStyle, key, elem, i),
						selectedTextContainerStyle: tryToUseAsFunction(
							selectedTextContainerStyle,
							key,
							elem,
							i,
						),
						leftIcon: tryToUseAsFunction(leftIcon, key, elem, i),
						leftIconStyle: tryToUseAsFunction(leftIconStyle, key, elem, i),
						rightIcon: tryToUseAsFunction(rightIcon, key, elem, i),
						rightIconStyle: tryToUseAsFunction(rightIconStyle, key, elem, i),
					};
					listJSX.push(
						<Item
							isSelected={isSelected}
							elem={data[dataKey]}
							index={i}
							id={key}
							key={key}
							multiSelectActive={multiSelectActive}
							onPress={onPress}
							onSelect={onSelect}
							setMultiSelectActive={setMultiSelectActive}
							leftIconOnLongPress={leftIconOnLongPress}
							leftIconOnPress={leftIconOnPress}
							rightIconOnLongPress={rightIconOnLongPress}
							rightIconOnPress={rightIconOnPress}
							{...itemStyles}
						/>,
					);
				}
			} else {
				const keys = Object.keys(data);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					const elem = data[key];
					if (filter(key, elem)) {
						const isSelected = selected.has(key);
						const itemStyles = {
							textStyle: tryToUseAsFunction(textStyle, key, elem, i),
							selectedTextStyle: tryToUseAsFunction(selectedTextStyle, key, elem, i),
							textContainerStyle: tryToUseAsFunction(
								textContainerStyle,
								key,
								elem,
								i,
							),
							selectedTextContainerStyle: tryToUseAsFunction(
								selectedTextContainerStyle,
								key,
								elem,
								i,
							),
							leftIcon: tryToUseAsFunction(leftIcon, key, elem, i),
							leftIconStyle: tryToUseAsFunction(leftIconStyle, key, elem, i),
							rightIcon: tryToUseAsFunction(rightIcon, key, elem, i),
							rightIconStyle: tryToUseAsFunction(rightIconStyle, key, elem, i),
						};
						listJSX.push(
							<Item
								isSelected={isSelected}
								elem={data[key]}
								index={i}
								id={key}
								key={key}
								multiSelectActive={multiSelectActive}
								onPress={onPress}
								onSelect={onSelect}
								setMultiSelectActive={setMultiSelectActive}
								leftIconOnLongPress={leftIconOnLongPress}
								leftIconOnPress={leftIconOnPress}
								rightIconOnLongPress={rightIconOnLongPress}
								rightIconOnPress={rightIconOnPress}
								{...itemStyles}
							/>,
						);
					}
				}
			}
			return <>{listJSX.length === 0 ? renderWhenEmpty : listJSX}</>;
		},
	);
};

export default BuildSelectableList;
