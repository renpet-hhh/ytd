import { TrackDataList, TrackData } from 'src/types/data';
import { setData, getData } from './fs';
import AsyncStorage from '@react-native-community/async-storage';
import errors from 'src/constants/errors';
import { getFullPath } from './settings';
import { unlink } from 'react-native-fs';
import { deleteTracksFromAllPlaylists } from './playlist';

export const updateTracks = async (tracks: Partial<TrackDataList>): Promise<void> => {
	await setData(tracks, 'track@');
};
export const getTracks = async (): Promise<TrackDataList> => {
	return await getData('track@');
};
export const getTrack = async (id: string): Promise<TrackData> => {
	const trackStr = await AsyncStorage.getItem('track@' + id);
	if (trackStr === null) {
		throw Error(errors.AUDIO.NOT_FOUND);
	}
	return JSON.parse(trackStr);
};
/** If track === null, remove the key id from the storage */
export const updateTrack = async (id: string, track: TrackData | null): Promise<void> => {
	if (track === null) {
		await AsyncStorage.removeItem('track@' + id);
		return;
	}
	await updateTracks({ [id]: track });
};

export const renameTrack = async (
	id: string,
	newName: string,
	renameWhat: 'title' | 'artist' = 'title',
): Promise<void> => {
	const track = await getTrack(id);
	if (track) {
		if (renameWhat === 'title' || renameWhat === 'artist') {
			track[renameWhat] = newName;
		}
	}
	await updateTrack(id, track);
};

const removeTrackFromJSON = async (toDelete: string | Set<string>): Promise<void> => {
	if (!(toDelete instanceof Set)) toDelete = new Set([toDelete]);
	const keys = [...toDelete].map(x => 'track@' + x);
	await AsyncStorage.multiRemove(keys);
};

/** This function is not async-safe */
export const deleteTrack = async (toDelete: string | Set<string>): Promise<void> => {
	const unlinkPromises = [];
	if (!(toDelete instanceof Set)) toDelete = new Set([toDelete]);
	const audioDirPath = await getFullPath('audio');
	for (const id of toDelete) {
		unlinkPromises.push(
			unlink(`${audioDirPath}/${id}`).catch(err =>
				console.warn('Delete audio failed: ' + err.message),
			),
		);
	}
	await Promise.all([
		...unlinkPromises,
		removeTrackFromJSON(toDelete),
		deleteTracksFromAllPlaylists(toDelete),
	]);
};
