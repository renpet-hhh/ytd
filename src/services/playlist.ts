import { Playlist, PlaylistList } from 'src/types/data';
import errors from 'src/constants/errors';
import { transformToTrack, convertTrackIdToReactKey } from 'src/utils/player';
import TrackPlayer, { Track } from 'react-native-track-player';
import { updateCurrentPlaylist } from 'src/utils/internalSettings';
import { setData, getData, hasKey } from './fs';
import AsyncStorage from '@react-native-community/async-storage';

export const updatePlaylists = async (playlists: PlaylistList): Promise<void> => {
	await setData(playlists, 'playlist@');
};
export const getPlaylists = async (): Promise<PlaylistList> => {
	return await getData('playlist@');
};
export const updatePlaylist = async (name: string, playlist: Playlist): Promise<void> => {
	await updatePlaylists({ [name]: playlist });
};
export const getPlaylist = async (name: string): Promise<Playlist> => {
	const playlistStr = await AsyncStorage.getItem('playlist@' + name);
	if (playlistStr === null) {
		throw Error(errors.PLAYLIST.NOT_FOUND);
	}
	return JSON.parse(playlistStr);
};

export const createPlaylist = async (name: string): Promise<void> => {
	if (!name) throw Error(errors.PLAYLIST.CREATE.EMPTY_IS_INVALID);
	if (await hasKey(name)) throw Error(errors.PLAYLIST.CREATE.ALREADY_EXISTS);
	const playlist: Playlist = {
		tracksIds: [],
		repeat: TrackPlayer.REPEAT_MODE_OFF,
	};
	await updatePlaylist(name, playlist);
};

export const deletePlaylist = async (toDelete: string | Set<string>): Promise<void> => {
	if (toDelete instanceof Set) {
		await AsyncStorage.multiRemove([...toDelete].map(x => 'playlist@' + x));
	} else {
		await AsyncStorage.removeItem('playlist@' + toDelete);
	}
};

export const setPlaylistTracks = async (name: string, tracks: string[]): Promise<void> => {
	const playlist = await getPlaylist(name);
	playlist.tracksIds = tracks;
	await updatePlaylist(name, playlist);
};

export const addTrackToPlaylist = async (
	name: string,
	toAdd: string | Set<string>,
): Promise<void> => {
	const playlist = await getPlaylist(name);
	if (!(toAdd instanceof Set)) toAdd = new Set([toAdd]);
	playlist.tracksIds = [...playlist.tracksIds, ...toAdd];
	await updatePlaylist(name, playlist);
};

export const deleteTrackFromPlaylist = async (
	name: string,
	toDelete: string | Set<string>,
): Promise<void> => {
	const playlist = await getPlaylist(name);
	if (!(toDelete instanceof Set)) toDelete = new Set([toDelete]);
	playlist.tracksIds = playlist.tracksIds.filter(x => !(toDelete as Set<string>).has(x));
	await updatePlaylist(name, playlist);
};

export const deleteTracksFromAllPlaylists = async (
	toDelete: string | Set<string>,
): Promise<void> => {
	const playlists = await getPlaylists();
	const filter =
		toDelete instanceof Set
			? (id: string) => {
					return !toDelete.has(id);
			  }
			: (id: string) => id !== toDelete;
	for (const playlistName in playlists) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		playlists[playlistName]!.tracksIds = playlists[playlistName]!.tracksIds.filter(filter);
	}
	await updatePlaylists(playlists);
};
type PlaylistPlayOrder = 'inOrder' | 'random';
interface PlayPlalistOptions {
	/** Playlist order, ignored if `name` is null */
	order?: PlaylistPlayOrder;
	/** When specified, the first track to be played will be the the track with this index
	 * (starts by 0) */
	startBy?: number;
	/** If the `name` argument is a string, this is ignored. If `name` is null,
	 * this option is required and this track will be played */
	singleTrack?: string;
	/** Whether the track should repeat */
	shouldRepeat?: boolean;
}

/** Plays a playlist or a single track
 *
 * If name is a string, the playlist will be fetched from the local JSON files.
 * If name is null, you must specify a track in the singleTrack option
 */
export const playPlaylist = async (
	name: string | null,
	options?: PlayPlalistOptions,
): Promise<void> => {
	if (name === null) {
		if (!options?.singleTrack) {
			throw Error('Playlist name is null and no singleTrack was specified');
		}
		const playlist: Playlist = {
			tracksIds: [options.singleTrack],
			repeat: options.shouldRepeat
				? TrackPlayer.REPEAT_MODE_ONE
				: TrackPlayer.REPEAT_MODE_OFF,
		};
		await updateCurrentPlaylist(name, playlist);
		await TrackPlayer.reset();
		await TrackPlayer.add(await transformToTrack([options.singleTrack]));
		await TrackPlayer.play();
		return;
	}
	const playlist = await getPlaylist(name);
	const { tracksIds } = playlist;
	const playlistTracks: Track[] = await transformToTrack([
		...convertTrackIdToReactKey(tracksIds),
	]);
	await updateCurrentPlaylist(name, playlist);
	await TrackPlayer.reset();
	if (options?.startBy) {
		const before = playlistTracks.slice(0, options.startBy);
		const after = playlistTracks.slice(options.startBy + 1);
		const selectedTrack = playlistTracks[options.startBy];
		await TrackPlayer.add(selectedTrack);
		await TrackPlayer.play();
		await TrackPlayer.add(before, selectedTrack.id);
		await TrackPlayer.add(after);
	} else if (options?.order) {
		switch (options.order) {
			case 'inOrder':
				await TrackPlayer.add(playlistTracks);
				break;
			case 'random':
				await TrackPlayer.add(playlistTracks.sort(() => Math.random() * 2 - 1));
		}
		await TrackPlayer.play();
	}
};
