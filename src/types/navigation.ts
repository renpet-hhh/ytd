import { Playlist } from './data';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export type Routes = {
	Home: undefined;
	Playlists: undefined;
	AllSongs: undefined;
	Playlist: { playlist: Playlist; name: string };
	Settings: undefined;
};

export type ScreenProps<T extends keyof Routes> = {
	route: RouteProp<Routes, T>;
	navigation: StackNavigationProp<Routes, T>;
};
