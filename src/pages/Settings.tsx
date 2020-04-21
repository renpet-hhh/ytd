import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import colors from 'src/constants/colors';
import EditableField from 'src/components/generic/EditableField';
import { getSettings, setSettings, changeStorageMount } from 'src/services/settings';
import IconButton from 'src/components/generic/IconButton';
import { Settings as SettingsType } from 'src/types/data';
import TrackPlayer from 'react-native-track-player';
import { verifyIntegrity } from 'src/services/verify';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.BROWN,
		alignItems: 'center',
	},
	containerForLoading: {
		flex: 1,
		backgroundColor: colors.BROWN,
		justifyContent: 'center',
		alignItems: 'center',
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
	iconButton: {
		padding: 10,
		borderColor: colors.DEAD_PURPLE,
		borderWidth: 2,
		marginVertical: 5,
	},
	iconButtonText: {
		fontSize: 18,
		color: colors.GOLD,
	},
	icon: {
		fontSize: 18,
		color: colors.SUN,
		marginRight: 12,
	},
});
const Settings = (): JSX.Element | null => {
	const [localSettings, setLocalSettings] = useState<SettingsType | null>(null);
	const refreshSettings = useCallback(async () => {
		setLocalSettings(await getSettings());
	}, []);
	useEffect(() => {
		refreshSettings();
	}, [refreshSettings]);
	const saveServer = useCallback(
		async (text: string): Promise<void> => {
			const settings = await getSettings();
			settings.server = text;
			await setSettings(settings);
			await refreshSettings();
		},
		[refreshSettings],
	);
	if (localSettings === null)
		return (
			<View style={styles.containerForLoading}>
				<ActivityIndicator size={120} />
			</View>
		);
	const { server, useSDcard } = localSettings;
	const memoryStorageText =
		useSDcard === null
			? null
			: `You are currently using the ${useSDcard ? 'SD card' : 'internal storage'}`;
	return (
		<View style={styles.container}>
			<EditableField
				style={styles.editableInput}
				label="Server"
				updateTextTo={server}
				onEditComplete={saveServer}
			/>
			<Text style={styles.memoryStorageText}>{memoryStorageText}</Text>
			{useSDcard !== null && (
				<IconButton
					name="storage"
					onPress={async () => {
						setLocalSettings(null); // show loading
						TrackPlayer.destroy();
						await changeStorageMount().catch((err: Error) => {
							Alert.alert(`Operation failed`, err.message);
						});
						await refreshSettings();
					}}
					textStyle={styles.iconButtonText}
					style={styles.iconButton}
					iconStyle={styles.icon}>
					{`Move to ${useSDcard ? `internal storage` : `SD card`}`}
				</IconButton>
			)}
			<IconButton
				name="check"
				onPress={verifyIntegrity}
				textStyle={styles.iconButtonText}
				style={styles.iconButton}
				iconStyle={styles.icon}>
				Verify integrity
			</IconButton>
		</View>
	);
};

export default Settings;
