import { RepeatMode } from 'react-native-track-player';

export interface TrackData {
	title: string;
	artist: string;
	thumbnail: string;
}
export type TrackDataList = Record<string, TrackData | undefined>;

export interface Playlist {
	tracksIds: string[];
	/** Repeat mode for this playlist. Default is none */
	repeat: RepeatMode;
}
export type PlaylistList = Record<string, Playlist | undefined>;

export interface InternalSettings {
	/** Current playlist being played. A null name indicates it is an anonymous single track playlist */
	currentPlaylist?: Omit<Playlist, 'tracksIds'> & { name: string | null };
}
export interface Settings {
	server: string;
	useSDcard: boolean;
}
// export as value too so we can check in run time
export type SettingName = keyof Settings;
export const SettingName = new Set<SettingName>(['server']);
