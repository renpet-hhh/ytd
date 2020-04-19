import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Routes } from 'src/types/navigation';
import colors from 'src/constants/colors';

type Props = {
	navigation: StackNavigationProp<Routes, 'Home'>;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.BACKGROUND_PURPLE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 40,
		position: 'absolute',
		top: 100,
		color: colors.WHITE,
	},
	menuMainButton: {
		marginVertical: 10,
		justifyContent: 'center',
		alignItems: 'center',
		width: 200,
		height: 60,
		backgroundColor: colors.PINK,
		borderRadius: 3,
	},
	menuMainButtonText: {
		fontSize: 22,
		color: '#420B02',
	},
	versionText: {
		marginTop: 20,
		color: colors.WHITE,
		fontSize: 12,
	},
});

const Home = ({ navigation }: Props): JSX.Element => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>ytd</Text>
			<TouchableOpacity
				onPress={() => navigation.navigate('Playlists')}
				style={styles.menuMainButton}>
				<Text style={styles.menuMainButtonText}>Playlists</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => navigation.navigate('AllSongs')}
				style={styles.menuMainButton}>
				<Text style={styles.menuMainButtonText}>All songs</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => navigation.navigate('Settings')}
				style={styles.menuMainButton}>
				<Text style={styles.menuMainButtonText}>Settings</Text>
			</TouchableOpacity>
			<Text style={styles.versionText}>v. 0.1.0</Text>
		</View>
	);
};

export default Home;
