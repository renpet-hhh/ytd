import { Track } from 'react-native-track-player';
import { getFullPath } from 'src/services/settings';
import { getTracksJSON } from 'src/services/download';
import TrackPlayer from 'react-native-track-player';

export const idFromReactKey = (reactKey: string): string => {
	return reactKey.replace(/\/.*$/, '');
};
export const convertTrackIdToReactKey = (tracksIds: string[]): Set<string> => {
	const reactKeys = new Set<string>();
	for (const id of tracksIds) {
		if (reactKeys.has(id)) {
			let count = 0;
			for (const key of reactKeys) {
				if (idFromReactKey(key) === id) count++;
			}
			reactKeys.add(`${id}/${count}`);
			continue;
		}
		reactKeys.add(id);
	}
	return reactKeys;
};
export const convertReactKeyToTrackId = (reactKeys: Set<string>): string[] => {
	return [...reactKeys].map(key => idFromReactKey(key));
};

/** Merges TrackData information and constructs a Track object that can be
 * used in TrackPlayer methods */
export const transformToTrack = async (keys: string[]): Promise<Track[]> => {
	const tracks = await getTracksJSON();
	const audioDirPath = await getFullPath('audio');
	return keys.map(key => {
		const audioId = idFromReactKey(key);
		const track = tracks[audioId];
		if (!track) throw Error(`Couldn't find track ${audioId}`);
		return {
			id: key,
			url: `${audioDirPath}/${audioId}`,
			title: track.title,
			artist: track.artist,
			artwork: track.thumbnail,
		};
	});
};

export const replaceQueue = async (queue: string[]): Promise<void> => {
	const tracks = await transformToTrack(queue);
	const currentQueue = await TrackPlayer.getQueue();
	const currTrack = await TrackPlayer.getCurrentTrack();
	const currTrackIndex = queue.findIndex(s => s === currTrack);
	if (currTrackIndex === -1) {
		throw Error(`You didn't specify the track currently being played in the new queue`);
	}
	const before = tracks.slice(0, currTrackIndex);
	const after = tracks.slice(currTrackIndex + 1);
	const toRemove = currentQueue.filter(t => t.id !== currTrack).map(t => t.id);
	// we need to remove separately
	// react-native-track-player bug, see https://github.com/react-native-kit/react-native-track-player/issues/840
	for (const idToRemove of toRemove) {
		await TrackPlayer.remove(idToRemove);
	}
	await TrackPlayer.add(before, currTrack);
	await TrackPlayer.add(after);
};
