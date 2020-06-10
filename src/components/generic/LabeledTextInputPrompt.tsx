import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, TextInputProps } from 'react-native';
import LabeledTextInput from './LabeledTextInput';
import AbsoluteBackground from './AbsoluteBackground';
import colors from 'src/constants/colors';

interface Props {
	label: string;
	visible: boolean;
	close: () => void;
	onPress?: (text: string) => void;
	buttonText?: string;
	placeholder?: string;
}

const styles = StyleSheet.create({
	container: {
		marginTop: Dimensions.get('window').height * 0.3,
		backgroundColor: colors.BLACK,
		flexDirection: 'column',
		alignItems: 'center',
		padding: 10,
		paddingVertical: 30,
	},
	label: {
		color: colors.GOLD,
		fontSize: 24,
	},
	input: {
		flex: 1,
		marginHorizontal: 10,
		color: colors.GOLD,
		borderColor: colors.GOLD,
		borderWidth: 1,
	},
	button: {
		marginTop: 40,
		backgroundColor: colors.BLACK,
		borderColor: colors.GOLD,
		borderWidth: 1,
		borderRadius: 5,
		padding: 10,
	},
	buttonText: {
		fontSize: 24,
		color: colors.GOLD,
	},
});

const LabeledTextInputPrompt = (props: Props): JSX.Element => {
	const { label, visible, close, onPress, buttonText, placeholder } = props;
	const [text, setText] = useState('');
	const inputProps: TextInputProps = {
		style: styles.input,
		placeholder,
		placeholderTextColor: colors.DEAD_PURPLE,
		onChangeText: setText,
	};
	const onPressWithText = useCallback(() => {
		onPress?.(text);
	}, [onPress, text]);
	return (
		<AbsoluteBackground visible={visible} close={close}>
			<View style={styles.container}>
				<LabeledTextInput inputProps={inputProps} textStyle={styles.label} label={label} />
				<TouchableOpacity style={styles.button} onPress={onPressWithText}>
					<Text style={styles.buttonText}>{buttonText}</Text>
				</TouchableOpacity>
			</View>
		</AbsoluteBackground>
	);
};

export default LabeledTextInputPrompt;
