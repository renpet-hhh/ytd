import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	NativeSyntheticEvent,
	TextInputSubmitEditingEventData,
	StyleSheet,
	ViewStyle,
	TextStyle,
	BackHandler,
} from 'react-native';
import IconButton from './IconButton';
import colors from 'src/constants/colors';

interface Props {
	onEditComplete?: (value: string) => void;
	/** You don't need to specify this prop, since this component is self controlled,
	 * but you might want to interfere with this component's internal state. Every time
	 * this prop is updated (and not undefined nor null), the text will be updated to this value.
	 */
	updateTextTo?: string | null;
	style?: ViewStyle;
	iconStyle?: TextStyle;
	label?: string;
}
const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	icon: {
		fontSize: 32,
		color: colors.GOLD,
	},
	text: {
		marginHorizontal: 15,
		fontSize: 24,
		color: colors.GOLD,
		textAlign: 'right',
		flex: 1,
		borderColor: colors.DEAD_PURPLE,
		borderWidth: 2,
		paddingVertical: 10,
		paddingRight: 10,
	},
	label: {
		color: colors.SUN,
		fontSize: 24,
	},
});

const EditableField = ({
	updateTextTo,
	onEditComplete,
	style,
	iconStyle,
	label,
}: Props): JSX.Element => {
	const [text, setText] = useState(updateTextTo ?? '');
	const [isEditing, setIsEditing] = useState(false);
	const textInputRef: React.RefObject<TextInput> = useRef(null);
	const edit = useCallback(() => {
		setIsEditing(true);
	}, []);
	useEffect(() => {
		if (isEditing) textInputRef.current?.focus();
	}, [isEditing]);
	useEffect(() => {
		if (updateTextTo !== undefined && updateTextTo !== null) setText(updateTextTo);
	}, [updateTextTo]);
	useEffect(() => {
		const subs = [
			BackHandler.addEventListener('hardwareBackPress', () => {
				if (!textInputRef.current) return false;
				const isFocused = textInputRef.current?.isFocused();
				if (isFocused) {
					textInputRef.current.blur();
					setIsEditing(false);
					setText(updateTextTo ?? '');
				}
				return isFocused;
			}),
		];
		return () => subs.forEach(sub => sub.remove());
	}, [onEditComplete, updateTextTo]);
	const onSubmitEditing = useCallback(
		(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
			setIsEditing(false);
			onEditComplete?.(e.nativeEvent.text);
		},
		[onEditComplete],
	);
	return (
		<View style={[styles.container, style]}>
			<Text style={styles.label}>{label}</Text>
			{isEditing ? (
				<TextInput
					ref={textInputRef}
					value={text}
					onChangeText={setText}
					onSubmitEditing={onSubmitEditing}
					style={[styles.text, isEditing ? { color: colors.SUN } : null]}
					selectTextOnFocus
					defaultValue=""
				/>
			) : (
				<Text numberOfLines={1} style={[styles.text]} onPress={edit}>
					{text}
				</Text>
			)}
			<IconButton iconStyle={[styles.icon, iconStyle]} name="edit" onPress={edit} />
		</View>
	);
};

export default EditableField;
