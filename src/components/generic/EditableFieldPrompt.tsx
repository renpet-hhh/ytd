import React, { useEffect } from 'react';
import AbsoluteBackground from './AbsoluteBackground';
import EditableField from './EditableField';
import { StyleSheet, BackHandler, View, Dimensions } from 'react-native';
import colors from 'src/constants/colors';

interface Props {
	visible: boolean;
	close: () => void;
	label: string;
	updateTextTo?: string;
	onEditComplete?: (text: string) => void;
}
const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: Dimensions.get('window').height * 0.3,
		marginHorizontal: 10,
		padding: 8,
		borderColor: colors.GOLD,
		borderWidth: 1,
		backgroundColor: colors.BLACK,
	},
});

const EditableFieldPrompt = (props: Props): JSX.Element => {
	const { label, updateTextTo, onEditComplete, visible, close } = props;
	useEffect(() => {
		const subs = [
			BackHandler.addEventListener('hardwareBackPress', () => {
				if (visible) {
					close();
					return true;
				}
				return false;
			}),
		];
		return () => subs.forEach(sub => sub.remove());
	}, [visible, close]);
	return (
		<AbsoluteBackground visible={visible} close={close}>
			<View style={styles.container}>
				<EditableField
					label={label}
					updateTextTo={updateTextTo}
					onEditComplete={onEditComplete}
				/>
			</View>
		</AbsoluteBackground>
	);
};

export default EditableFieldPrompt;
