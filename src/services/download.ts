import {
	downloadFile,
	exists,
	unlink,
	readFile,
	writeFile,
	stopDownload,
	moveFile,
	DownloadFileOptions,
} from 'react-native-fs';
import { TrackData, TrackDataList } from 'src/types/data';
import axios, { Canceler } from 'axios';
import errors from 'src/constants/errors';
import PushNotification from 'react-native-push-notification';
import { getServerDownloadPath } from 'src/utils/extractIdFromURL';
import { deleteTracksFromAllPlaylists } from './playlist';
import { getInfoFilePath, getFullPath } from 'src/services/settings';

export const getTracksJSON = async (): Promise<TrackDataList> => {
	const audioDataPath = await getInfoFilePath('audioData');
	const content = await readFile(audioDataPath).catch(err => {
		console.log(err);
		return '{}';
	});
	return JSON.parse(content);
};

export const setTracksJSON = async (tracks: TrackDataList): Promise<void> => {
	const audioDataPath = await getInfoFilePath('audioData');
	await writeFile(audioDataPath, JSON.stringify(tracks));
};

export const downloadTrackInfo = (
	url: string,
): { promise: Promise<TrackData & { id: string }>; cancel: Canceler } => {
	const source = axios.CancelToken.source();
	const promise = (async (): Promise<TrackData & { id: string }> => {
		const downloadPath = await getServerDownloadPath('info', url);
		const res = await axios
			.get(downloadPath, {
				timeout: 10000,
				cancelToken: source.token,
			})
			.catch(err => {
				console.log('catch axios');
				throw err;
			});
		if (res && res.status >= 200 && res.status < 300 && res.data) {
			const { title, author: artist, id, thumbnailUrl } = res.data; // this type depends on the backend API
			if (title && artist && id && thumbnailUrl) {
				const track = { title, artist, thumbnail: thumbnailUrl, id };
				return track;
			}
			throw Error(errors.AUDIO.DOWNLOAD.INFO.MISSING);
		}
		throw Error(errors.AUDIO.DOWNLOAD.FAILED);
	})();
	return { promise, cancel: source.cancel };
};

const removeTrackFromJSON = async (toDelete: string | Set<string>): Promise<void> => {
	const audioDataPath = await getInfoFilePath('audioData');
	const content = await readFile(audioDataPath);
	const videos: TrackDataList = JSON.parse(content);
	if (!(toDelete instanceof Set)) toDelete = new Set([toDelete]);
	for (const id of toDelete) {
		delete videos[id];
	}
	await writeFile(audioDataPath, JSON.stringify(videos));
};

const addTrackToJSON = async (id: string, track: TrackData): Promise<void> => {
	const audioDataPath = await getInfoFilePath('audioData');
	const file: TrackDataList = JSON.parse(await readFile(audioDataPath));
	file[id] = track;
	console.log('writing to file:');
	console.log(file);
	await writeFile(audioDataPath, JSON.stringify(file));
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

export const renameTrack = async (
	id: string,
	newName: string,
	tracksSource?: TrackDataList,
	renameWhat: 'title' | 'artist' = 'title',
): Promise<void> => {
	const tracks = tracksSource ?? (await getTracksJSON());
	if (tracks[id]) {
		if (renameWhat === 'title' || renameWhat === 'artist') {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			tracks[id]![renameWhat] = newName;
		}
	}
	await setTracksJSON(tracks);
};

/**
 * Downloads a youtube video from URL and writes the content to path
 * ```
 * `${audio directory}/${video id}`
 * ```
 */
export const downloadTrack = async (
	url: string,
): Promise<{ promise: Promise<void>; cancel: () => void }> => {
	const NOTIFICATION_ID = Date.now()
		.toString()
		.slice(-9); // fits in 32bit int
	PushNotification.localNotification({
		message: `Downloading ${url}`,
		title: `Starting download...`,
		playSound: false,
		vibrate: false,
		importance: 'low',
		id: NOTIFICATION_ID,
		priority: 'low',
	});
	const audioDirPath = await getFullPath('audio');
	const tempDirPath = await getFullPath('temp');
	const urlEncoded = encodeURIComponent(url);
	const tempPath = `${tempDirPath}/${urlEncoded}`;
	let bytesDownloaded = 0;
	const progress: DownloadFileOptions['progress'] = ({ bytesWritten }) => {
		const readMB = (bytesWritten / 1000000).toFixed(2) + 'MB';
		bytesDownloaded = bytesWritten;
		console.log(readMB);
		PushNotification.localNotification({
			message: `Downloading (${readMB})`,
			title: `Downloading ${url}`,
			playSound: false,
			vibrate: false,
			importance: 'low',
			id: NOTIFICATION_ID,
			priority: 'low',
		});
	};
	const fromUrl = await getServerDownloadPath('audio', url);
	console.log(fromUrl);
	console.log('start downloads');
	const downloadAudioObj = downloadFile({
		fromUrl,
		toFile: tempPath,
		progressInterval: 100,
		progressDivider: 10,
		progress,
	});
	const promise = (async (): Promise<void> => {
		const downloadInfoObj = downloadTrackInfo(url);
		const clean = async (err: Error): Promise<void> => {
			console.log('error on download, cleaning...');
			console.log(err.stack);
			PushNotification.localNotification({
				message: `Error: ${err.message}`,
				title: `Download ${url}`,
				playSound: false,
				vibrate: false,
				importance: 'low',
				id: NOTIFICATION_ID,
				priority: 'low',
			});
			downloadInfoObj.cancel();
			stopDownload(downloadAudioObj.jobId);
			await unlink(tempPath).catch(() => {
				console.log('The partial downloaded file was not found');
			});
			// handle possibly rejected (cancelled) promises
			await downloadAudioObj.promise.catch(() => null);
			await downloadInfoObj.promise.catch(() => null);
		};
		console.log('wait for first download to resolve/reject');
		const firstPromise = await Promise.race([
			downloadAudioObj.promise,
			downloadInfoObj.promise,
		]).catch(async err => {
			await clean(err);
			throw err;
		});
		// no promise rejected yet, let's see which one resolved first
		if (!('_isInfo' in firstPromise)) {
			// download audio finished first, but we have to wait for id information anyway
			// note that this is very unlikely, probably download audio won't resolve first
			await downloadInfoObj.promise.catch(async err => {
				await clean(err);
				throw err;
			});
		}
		// now we already downloaded the info, so the following promise can't throw
		const { id, ...infoResult } = await downloadInfoObj.promise.catch(async err => {
			await clean(err);
			throw { ...err, message: errors.INTERNAL.FAILED_ASSERTION };
		});
		const pathToDownload = `${audioDirPath}/${id}`;
		if (await exists(pathToDownload)) {
			const err = Error(errors.AUDIO.DOWNLOAD.ALREADY_EXISTS);
			await clean(err);
			throw err;
		}
		// now we wait for the download audio promise to resolve (or it might even have resolved first)
		const downloadResult = await downloadAudioObj.promise.catch(async err => {
			await clean(err);
			throw err;
		});
		if (downloadResult.statusCode === 200) {
			await Promise.all([moveFile(tempPath, pathToDownload), addTrackToJSON(id, infoResult)]);
			console.log('success');
			const readMB = (bytesDownloaded / 1000000).toFixed(2) + 'MB';
			setTimeout(
				() =>
					PushNotification.localNotification({
						message: `Downloaded ${infoResult.title} - ${infoResult.artist}`,
						title: `Download completed (${readMB})`,
						playSound: false,
						vibrate: false,
						importance: 'low',
						id: NOTIFICATION_ID,
						priority: 'low',
					}),
				2500,
			);
			console.log('download successful!');
			console.log(`downloaded to ${pathToDownload}`);
		}
	})();
	return {
		promise,
		cancel: () => stopDownload(downloadAudioObj.jobId),
	};
};
