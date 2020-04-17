import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import colors from 'src/constants/colors';
import EditableField from 'src/components/generic/EditableField';
import { getSettings, setSettings } from 'src/services/settings';
import useResolve from 'src/hooks/useResolve';
import { writeExternalStoragePermission } from 'src/constants/localpath';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.BROWN,
	},
	memoryStorageText: {
		fontSize: 16,
		color: colors.GOLD,
		margin: 10,
	},
	editableInput: {
		marginHorizontal: 20,
		marginVertical: 20,
	},
});
const Settings = (): JSX.Element => {
	const settings = useResolve(useRef(getSettings()).current);
	const saveServer = useCallback(async (text: string): Promise<void> => {
		const updatedSettings = await getSettings();
		updatedSettings.server = text;
		setSettings(updatedSettings);
	}, []);
	const memoryStorage = useResolve(writeExternalStoragePermission);
	const memoryStorageText = memoryStorage
		? `You are currently using the ${
				memoryStorage === 'granted' ? 'SD card' : 'internal storage'
		  }`
		: null;
	return (
		<View style={styles.container}>
			<Text style={styles.memoryStorageText}>{memoryStorageText}</Text>
			<EditableField
				style={styles.editableInput}
				label="Server"
				updateTextTo={settings?.server}
				onEditComplete={saveServer}
			/>
		</View>
	);
};

export default Settings;
