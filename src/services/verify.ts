import errors from 'src/constants/errors';
import { alertAsync, alertAsyncAndSolveWith } from 'src/utils/promisify';
import { downloadTrackInfo, downloadTrack } from './download';
import { readDir, unlink } from 'react-native-fs';
import { getSettings, initSettings, setSettings, getFullPath } from './settings';
import { getPlaylists, updatePlaylist } from './playlist';
import { Alert } from 'react-native';
import { REPEAT_MODE_OFF } from 'react-native-track-player';
import { getTracks, updateTrack, deleteTrack } from './track';

const getCheckFunctionForSettings = (key: string): ((prop: unknown) => boolean) => {
	switch (key) {
		case 'server':
			return prop => typeof prop === 'string';
		case 'useSDcard':
			return prop => typeof prop === 'boolean';
	}
	return () => false;
};

const handleErr = async (err: Error): Promise<void> => {
	if (err.message === errors.USER_CANCELED) return;
	await alertAsync(`Error`, err.message);
};

const promptRetryDownloadTrack = async (id: string, download: 'info' | 'audio'): Promise<void> => {
	const url = `https://youtube.com/watch?v=${id}`;
	let tryAgain = true;
	const handler = async (): Promise<void> => {
		await alertAsyncAndSolveWith(`Downloading ${id}`, 'Download failed', 'Try again', () => {
			tryAgain = true;
			return Promise.resolve();
		});
	};
	while (tryAgain) {
		tryAgain = false;
		if (download === 'info') {
			const { promise, cancel } = downloadTrackInfo(url);
			Alert.alert(`Downloading ${id}`, `Please, wait...`, [
				{ text: 'Cancel', onPress: cancel },
			]);
			const trackData = await promise.catch(handler);
			if (trackData) {
				delete trackData.id;
				await updateTrack(id, trackData);
			}
		} else {
			const { promise, cancel } = await downloadTrack(url);
			Alert.alert(`Downloading ${id}`, `Please, wait...`, [
				{ text: 'Cancel', onPress: cancel },
			]);
			await promise.catch(handler);
		}
	}
};

const promptAboutMissingTrack = async (
	title: string,
	message: string,
	id: string,
	downloadWhat: 'info' | 'audio',
): Promise<void> => {
	const removeTrack = `Remove ${id}`;
	const downloadText = 'Download';
	const prompt = await alertAsync(title, message, [
		{ text: 'Ignore' },
		{ text: removeTrack },
		{ text: downloadText },
	]);
	if (prompt === removeTrack) {
		if (downloadWhat === 'info') {
			await updateTrack(id, null);
		} else {
			await deleteTrack(id);
		}
	} else if (prompt === downloadText) {
		await promptRetryDownloadTrack(id, downloadWhat);
	}
};

const verifySettingsIntegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking settings)';
	const settings = await getSettings();
	if (!settings || settings.server === undefined || settings.useSDcard === undefined) {
		await alertAsyncAndSolveWith(
			title,
			'Settings was not initialized',
			'Initialize settings',
			async () => await initSettings().catch(handleErr),
		);
	}
	const expectedSettingsKeys = new Set(['server', 'useSDcard']);
	const settingsKeys = Object.keys(settings);
	for (const key of settingsKeys) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const settingValue = (settings as any)[key];
		if (!expectedSettingsKeys.has(key)) {
			await alertAsyncAndSolveWith(
				title,
				`Unexpected key in settings: ${key}`,
				`Remove ${key}`,
				async () => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					delete (settings as any)[key];
					await setSettings(settings);
				},
			);
		}
		const validType = getCheckFunctionForSettings(key)(settingValue);
		if (!validType) {
			await alertAsync(title, `Key ${key} has incorrect type, key value is ${settingValue}`);
		}
	}
	return true;
};

const verifyTracksIntegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking audio)';
	const tracks = await getTracks();
	const tracksDirPath = await getFullPath('audio');
	if (!tracksDirPath) {
		await alertAsync(title, `Audio directory invalid: ${tracksDirPath}`);
	}
	const audioDir = await readDir(tracksDirPath).catch(handleErr);
	if (audioDir) {
		for (const file of audioDir) {
			if (file.isDirectory()) {
				await alertAsyncAndSolveWith(
					title,
					`Unexpected directory ${file.name} inside audio dir`,
					`Remove ${file.name}`,
					async () => {
						await unlink(file.path).catch(handleErr);
					},
				);
			}
		}
		const allKeysFromAudioDir = audioDir.map(d => d.name);
		const tracksIds = Object.keys(tracks);
		for (const id of tracksIds) {
			const trackData = tracks[id];
			if (!trackData) {
				await alertAsync(title, `Track with id ${id} is missing a body`);
				break;
			}
			if (!trackData.artist) {
				await alertAsync(title, `Track with id ${id} has no artist information`);
			}
			if (!trackData.thumbnail) {
				await alertAsync(title, `Track with id ${id} has no thumbnail information`);
			}
			if (!trackData.title) {
				await alertAsync(title, `Track with id ${id} has no title information`);
			}
			if (!allKeysFromAudioDir.find(k => k === id)) {
				const removeIdText = 'Remove id from audioData.json';
				const downloadAudioText = 'Download audio';
				const prompt = await alertAsync(
					title,
					`Audio directory is missing audio with id ${id}`,
					[{ text: 'Ignore' }, { text: removeIdText }, { text: downloadAudioText }],
				);
				if (prompt === removeIdText) {
					await deleteTrack(id);
				} else if (prompt === downloadAudioText) {
					await promptRetryDownloadTrack(id, 'audio');
				}
			}
		}
		const tracksIdsSet = new Set(tracksIds);
		for (const k of allKeysFromAudioDir) {
			if (!tracksIdsSet.has(k)) {
				await promptAboutMissingTrack(
					title,
					`id ${k} is not saved in the storage`,
					k,
					'info',
				);
			}
		}
	}
	return true;
};

const verifyPlaylistsIntegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking playlists)';
	const playlists = await getPlaylists();
	const playlistNames = Object.keys(playlists);
	const tracks = await getTracks();
	const tracksIds = Object.keys(tracks);
	const tracksDirPath = await getFullPath('audio');
	const audioDir = await readDir(tracksDirPath);
	const allKeysFromAudioDir = audioDir.map(d => d.name);
	const allKeysFromAudioDirSet = new Set(allKeysFromAudioDir);
	if (playlistNames.length !== new Set(playlistNames).size) {
		await alertAsync(title, `Some playlist has duplicate name`);
	}
	for (const name of playlistNames) {
		const playlist = playlists[name];
		if (!playlist) {
			await alertAsync(title, `Playlist ${name} is missing a body`);
			break;
		}
		if (typeof playlist.repeat !== 'number') {
			await alertAsyncAndSolveWith(
				title,
				`Repeat mode of playlist ${name} is not a number`,
				'Autofix',
				async () => {
					playlist.repeat = REPEAT_MODE_OFF;
					await updatePlaylist(name, playlist);
				},
			);
		}
		if (!playlist.tracksIds || !('length' in playlist.tracksIds)) {
			await alertAsync(title, `Tracks of playlist ${name} is not an array`);
		}
		for (const id of playlist.tracksIds) {
			if (tracksIds && !tracksIds.find(k => k === id)) {
				await promptAboutMissingTrack(
					title,
					`Track ${id} in playlist ${name} is not in the storage`,
					id,
					'info',
				);
			}
			if (!allKeysFromAudioDirSet.has(id)) {
				await promptAboutMissingTrack(
					title,
					`Track ${id} in playlist ${name} is not in the audio directory`,
					id,
					'audio',
				);
			}
		}
	}
	return true;
};

export const verifyIntegrity = async (): Promise<void> => {
	let shouldContinue = true;
	if (shouldContinue) {
		shouldContinue = await verifySettingsIntegrity().catch(() => false);
	}
	if (shouldContinue) {
		shouldContinue = await verifyTracksIntegrity().catch(() => false);
	}
	if (shouldContinue) {
		shouldContinue = await verifyPlaylistsIntegrity().catch(() => false);
	}
	if (!shouldContinue) {
		await alertAsync('Verification had to be aborted');
	} else {
		await alertAsync(`Verification complete`);
	}
};
