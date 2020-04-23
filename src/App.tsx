import './init';
import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from 'src/pages/Home';
import Playlists from 'src/pages/Playlists';
import { Routes } from 'src/types/navigation';
import Playlist from './pages/Playlist';
import AllSongs from './pages/AllSongs';
import Player from './components/specific/Player';
import { StyleSheet, View } from 'react-native';
import Settings from './pages/Settings';
import { downloadTrack } from './services/download';
import useSharedUrlSubscription from './hooks/useSubscription';
import errors from './constants/errors';
interface AppProps {
	// sent from native code
	sharedUrl?: string;
}

const Stack = createStackNavigator<Routes>();

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
});

const App = ({ sharedUrl }: AppProps): JSX.Element | null => {
	let initialRouteName: keyof Routes = 'Home';
	if (sharedUrl !== undefined) {
		initialRouteName = 'AllSongs';
	}
	const [urlToRetry, setUrlToRetry] = useState<string | null>('');
	useSharedUrlSubscription((_state, sUrl): void => {
		const run = async (): Promise<void> => {
			const { promise } = await downloadTrack(sUrl);
			await promise
				.then(() => {
					setUrlToRetry(url => (url === null ? '' : null)); // refresh child
				})
				.catch(err => {
					if (err.message !== errors.AUDIO.DOWNLOAD.ALREADY_EXISTS) setUrlToRetry(sUrl);
				});
		};
		run();
	}, sharedUrl);
	return (
		<View style={styles.wrapper}>
			<NavigationContainer>
				<Stack.Navigator
					screenOptions={{ headerShown: false }}
					initialRouteName={initialRouteName}
					key={initialRouteName}>
					<Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
					<Stack.Screen name="Playlists" component={Playlists} />
					<Stack.Screen name="AllSongs">
						{({ route, navigation }) => (
							<AllSongs
								route={route}
								navigation={navigation}
								urlToRetry={urlToRetry}
							/>
						)}
					</Stack.Screen>
					<Stack.Screen name="Playlist" component={Playlist} />
					<Stack.Screen name="Settings" component={Settings} />
				</Stack.Navigator>
			</NavigationContainer>
			<Player />
		</View>
	);
};

export default App;
