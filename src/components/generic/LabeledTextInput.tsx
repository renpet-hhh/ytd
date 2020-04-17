import React from 'react';
import { TextInput } from 'react-native-gesture-handler';
import {
	Text,
	View,
	StyleProp,
	TextStyle,
	ViewProps,
	StyleSheet,
	TextInputProps,
} from 'react-native';

type Props = ViewProps & {
	label: string;
	textStyle?: StyleProp<TextStyle>;
	inputProps?: TextInputProps;
};

const LabeledTextInput = React.forwardRef(
	({ label, textStyle, inputProps, style, ...props }: Props, ref: React.Ref<TextInput>) => {
		const styles = StyleSheet.create({
			container: {
				flexDirection: 'row',
				justifyContent: 'center',
				alignItems: 'center',
			},
		});

		return (
			<View style={[styles.container, style]} {...props}>
				<Text style={textStyle}>{label}</Text>
				<TextInput ref={ref} {...inputProps} />
			</View>
		);
	},
);

export default LabeledTextInput;
