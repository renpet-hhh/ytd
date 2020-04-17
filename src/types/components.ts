import { TextStyle, StyleProp, ViewStyle } from 'react-native';
export type RemoveAcceptCallback<T> = {
	[K in keyof T]: T[K] extends T[K] | ((...args: unknown[]) => infer R) ? R : T[K];
};
export type AcceptCallback<T, E> = T | ((key: string, x: E, index: number) => T);
export interface Typings<T> {
	SelectableList: {
		Args: {
			getData: () => Promise<{ [key: string]: T }>;
			dataToText: (key: string, x: T) => string;
		};
		RefMethods: {
			/** Refreshes the list according to the data (obtained by getData, see BuildSelectableList).
			 * The component already refreshes itself in basic operations
			 * so you will only need to refresh manually if you expect that
			 * the data changed while no interaction was being done
			 * on this component (for example, to implement a refresh button)
			 */
			refresh: () => Promise<void>;
		};
		ItemStyles: {
			textStyle?: AcceptCallback<StyleProp<TextStyle> | undefined, T>;
			selectedTextStyle?: AcceptCallback<StyleProp<TextStyle> | undefined, T>;
			textContainerStyle?: AcceptCallback<StyleProp<ViewStyle> | undefined, T>;
			selectedTextContainerStyle?: AcceptCallback<StyleProp<ViewStyle> | undefined, T>;
			leftIcon?: AcceptCallback<string | undefined, T>;
			leftIconStyle?: AcceptCallback<StyleProp<TextStyle> | undefined, T>;
			rightIcon?: AcceptCallback<string | undefined, T>;
			rightIconStyle?: AcceptCallback<StyleProp<TextStyle> | undefined, T>;
		};
		ItemProps: {
			/** key is the react key of the component (same specified in selected and/or filter) */
			onPress?: (key: string, data: T, index: number) => void;
			/** key is the react key of the component (same specified in selected and/or filter) */
			onSelect?: (key: string, data: T, index: number) => void;
			leftIconOnPress?: (key: string, x: T, index: number) => void;
			leftIconOnLongPress?: (key: string, x: T, index: number) => void;
			rightIconOnPress?: (key: string, x: T, index: number) => void;
			rightIconOnLongPress?: (key: string, x: T, index: number) => void;
		} & Typings<T>['SelectableList']['ItemStyles'];
		Props: {
			/** A set of react key strings used to identify the selected components */
			selected?: Set<string>;
			/** Specify a function to filter from data, or a set of react key strings.
			 * The strings are used to query data `(await getData())[eachStringOfFilter]`
			 * but you can change this mapping by using the `keyForData` prop
			 */
			filter?: ((key: string, data: T) => boolean) | Set<string>;
			/** **Not a react key**
			 *
			 * Key used to identify a resource in data. Multiple components can refer
			 * to a same resource in data, but their react keys must still be different.
			 * You must not specify repeated keys in filter or selected because they are
			 * used as react keys, but components with different react keys might refer to the
			 * same data. Thus, the data for each element is calculated as
			 * the `eachElementData` variable below
			 * ```
			 * const data = await getData();
			 * for (const key of filter) {
			 * 			const eachElementData = (await getData())[keyFromData(key)];
			 * }
			 * ```
			 * If you don't specify a filter set, this transformation won't be used. The
			 * react key will be the data key.
			 */
			keyForData?: (key: string) => string;
			renderWhenEmpty?: React.ReactNode;
			// Left icon
		} & Typings<T>['SelectableList']['ItemProps'];
	};
}
