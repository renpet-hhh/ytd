import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import colors from 'src/constants/colors';
import LabeledTextInput from 'src/components/generic/LabeledTextInput';
import { downloadTrack } from 'src/services/download';

const styles = StyleSheet.create({
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		justifyContent: 'space-evenly',
		alignItems: 'center',
		height: 200,
		backgroundColor: colors.GOLD,
		borderColor: colors.BROWN,
		borderWidth: 5,
		borderRadius: 5,
	},
	inputLabel: {
		marginLeft: 10,
		color: '#1A1B1A',
	},
	inputField: {
		paddingHorizontal: 15,
		marginHorizontal: 15,
		backgroundColor: colors.BROWN,
		borderRadius: 50,
		color: colors.SUN,
		fontSize: 16,
		alignSelf: 'stretch',
		marginTop: 10,
	},
	downloadButton: {
		backgroundColor: colors.GOLD,
		borderColor: colors.BROWN,
		borderWidth: 2,
		padding: 8,
		borderRadius: 5,
	},
	downloadButtonText: {
		fontSize: 32,
		color: colors.BROWN,
	},
});

const DownloadTrack = (): JSX.Element => {
	const [url, setUrl] = useState('');
	const [isDownloadEnabled, setIsDownloadEnabled] = useState(false);

	useEffect(() => {
		setIsDownloadEnabled(url.length > 0);
	}, [url]);

	const URLinputProps: React.ComponentPropsWithoutRef<typeof LabeledTextInput>['inputProps'] = {
		style: styles.inputField,
		placeholder: 'https://youtube.com/watch?v=...',
		placeholderTextColor: '#79785D',
		onChangeText: setUrl,
	};

	const download = async (): Promise<void> => {
		await downloadTrack(url).catch((err: Error) => {
			console.log(err.message);
		});
	};
	return (
		<View style={styles.centered} onStartShouldSetResponder={() => true}>
			<View style={styles.container}>
				<LabeledTextInput
					label="URL"
					textStyle={styles.inputLabel}
					inputProps={URLinputProps}
				/>
				<TouchableOpacity
					disabled={!isDownloadEnabled}
					onPress={download}
					style={styles.downloadButton}>
					<Text style={styles.downloadButtonText}>Download</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default DownloadTrack;
