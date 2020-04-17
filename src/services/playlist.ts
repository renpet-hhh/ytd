import { Playlist, PlaylistList, PlaylistRepeatMode } from 'src/types/data';
import { readFile, writeFile } from 'react-native-fs';
import errors from 'src/constants/errors';
import { transformToTrack, convertTrackIdToReactKey } from 'src/utils/player';
import TrackPlayer, { Track } from 'react-native-track-player';
import { getInternalSettings, setInternalSettings } from './settings';
import { getInfoFilePath } from 'src/constants/localpath';

export const getPlaylistsJSON = async (): Promise<PlaylistList> => {
	const playlistDataPath = await getInfoFilePath('playlistData');
	const playlistsFileContent = await readFile(playlistDataPath); // might throw
	const playlists = JSON.parse(playlistsFileContent);
	return playlists;
};
export const setPlaylistsJSON = async (playlists: PlaylistList): Promise<void> => {
	const playlistDataPath = await getInfoFilePath('playlistData');
	await writeFile(playlistDataPath, JSON.stringify(playlists));
};

export const createPlaylist = async (name: string): Promise<void> => {
	const playlists = await getPlaylistsJSON();
	if (!name) throw Error(errors.PLAYLIST.CREATE.EMPTY_IS_INVALID);
	if (playlists[name]) throw Error(errors.PLAYLIST.CREATE.ALREADY_EXISTS);
	const newPlaylist: Playlist = {
		tracksIds: [],
	};
	playlists[name] = newPlaylist;
	await setPlaylistsJSON(playlists);
};

export const deletePlaylist = async (toDelete: string | Set<string>): Promise<void> => {
	const playlists = await getPlaylistsJSON();
	if (toDelete instanceof Set) {
		for (const name of toDelete) {
			delete playlists[name];
		}
	} else {
		delete playlists[toDelete];
	}
	await setPlaylistsJSON(playlists);
};

export const setPlaylistTracks = async (
	name: string,
	tracks: string[],
	source?: Record<string, Playlist | undefined>,
): Promise<void> => {
	const playlists = source ?? (await getPlaylistsJSON());
	if (!name) throw Error(errors.PLAYLIST.CREATE.EMPTY_IS_INVALID);
	if (!playlists[name]) {
		playlists[name] = { tracksIds: [] };
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	playlists[name]!.tracksIds = tracks;
	await setPlaylistsJSON(playlists);
};

export const addTrackToPlaylist = async (
	name: string,
	toAdd: string | Set<string>,
): Promise<void> => {
	const playlists = await getPlaylistsJSON();
	if (!name) throw Error(errors.PLAYLIST.CREATE.EMPTY_IS_INVALID);
	if (!playlists[name]) {
		playlists[name] = { tracksIds: [] };
	}
	if (toAdd instanceof Set) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		playlists[name]!.tracksIds = [...new Set([...playlists[name]!.tracksIds, ...toAdd])];
	} else {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		playlists[name]!.tracksIds = [...new Set([...playlists[name]!.tracksIds, toAdd])];
	}
	await setPlaylistsJSON(playlists);
};

export const deleteTrackFromPlaylist = async (
	name: string,
	toDelete: string | Set<string>,
): Promise<void> => {
	const playlists = await getPlaylistsJSON();
	if (!name) throw Error(errors.PLAYLIST.CREATE.EMPTY_IS_INVALID);
	if (!playlists[name]) {
		playlists[name] = { tracksIds: [] };
	}
	if (toDelete instanceof Set) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		playlists[name]!.tracksIds = playlists[name]!.tracksIds.filter(t => !toDelete.has(t));
	} else {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		playlists[name]!.tracksIds = playlists[name]!.tracksIds.filter(t => t !== toDelete);
	}
	await setPlaylistsJSON(playlists);
};

export const deleteTracksFromAllPlaylists = async (
	toDelete: string | Set<string>,
): Promise<void> => {
	const playlists = await getPlaylistsJSON();
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
	await setPlaylistsJSON(playlists);
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
	/** If `name` is null, `singleTrack` will be played with this repeat mode */
	singleTrackRepeatMode?: PlaylistRepeatMode;
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
			repeat: options.singleTrackRepeatMode,
		};
		const internalSettings = await getInternalSettings();
		internalSettings.currentPlaylist = { ...playlist, name };
		await setInternalSettings(internalSettings);
		await TrackPlayer.reset();
		await TrackPlayer.add(await transformToTrack([options.singleTrack]));
		await TrackPlayer.play();
		return;
	}
	const playlist = (await getPlaylistsJSON())[name];
	if (!playlist) throw Error(`Couldn't find playlist with name ${name}`);
	const { tracksIds } = playlist;
	const playlistTracks: Track[] = await transformToTrack([
		...convertTrackIdToReactKey(tracksIds),
	]);
	const internalSettings = await getInternalSettings();
	internalSettings.currentPlaylist = { ...playlist, name };
	await setInternalSettings(internalSettings);
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
