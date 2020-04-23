import errors from 'src/constants/errors';
import { alertAsync, alertAsyncAndSolveWith } from 'src/utils/promisify';
import { TrackData } from 'src/types/data';
import {
	getTracksJSON,
	setTracksJSON,
	downloadTrackInfo,
	downloadTrack,
	deleteTrack,
} from './download';
import { writeFile, readDir, unlink, exists } from 'react-native-fs';
import {
	getInfoFilePath,
	getSettings,
	initSettings,
	setSettings,
	getFullPath,
	SDDirectoryPath,
	infoFilesName,
} from './settings';
import { getPlaylistsJSON } from './playlist';
import { Alert } from 'react-native';

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
				const { id: _id, ...info } = trackData;
				const tracks = await getTracksJSON();
				tracks[_id] = info;
				await setTracksJSON(tracks);
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
		await deleteTrack(id);
	} else if (prompt === downloadText) {
		await promptRetryDownloadTrack(id, downloadWhat);
	}
};

const verifyInitializationIntegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking initialization)';
	const tracks: Record<string, TrackData | undefined> = await getTracksJSON().catch(async () => {
		await alertAsyncAndSolveWith(
			title,
			`Error while reading tracks`,
			`Reset data about tracks`,
			async () => {
				await writeFile(await getInfoFilePath('audioData'), JSON.stringify({})).catch(
					handleErr,
				);
			},
		);
		return await getTracksJSON();
	});
	const playlists = await getPlaylistsJSON().catch(async () => {
		await alertAsyncAndSolveWith(
			title,
			`Error while reading playlists`,
			`Reset data about playlists`,
			async () => {
				await writeFile(await getInfoFilePath('playlistData'), JSON.stringify({})).catch(
					handleErr,
				);
			},
		);
		return await getPlaylistsJSON();
	});

	if (!tracks || !playlists) {
		return false;
	}
	return true;
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
	const tracks = await getTracksJSON();
	if ('length' in tracks) {
		await alertAsyncAndSolveWith(
			title,
			'audioData.json is an array',
			'Reset data about tracks',
			async () => {
				await writeFile(await getInfoFilePath('audioData'), JSON.stringify({}));
			},
		);
	}
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
		if (tracks) {
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
			for (const k of allKeysFromAudioDir) {
				if (!tracksIds.find(key => key === k)) {
					await alertAsyncAndSolveWith(
						title,
						`audioData.json is missing audio with id ${k}`,
						'Add id to audioData.json',
						async () => {
							const url = `https://youtube.com/watch?v=${k}`;
							const trackInfoDownload = downloadTrackInfo(url);
							Alert.alert(`Downloading info about ${k}`, 'Please, wait...', [
								{
									text: 'Cancel',
									onPress: () => trackInfoDownload.cancel(errors.USER_CANCELED),
								},
							]);
							const track = await trackInfoDownload.promise.catch(handleErr);
							if (track) {
								const { id, ...info } = track;
								tracks[id] = info;
								console.log(id);
								console.log(info);
								console.log(tracks);
								await setTracksJSON(tracks);
								await alertAsync(title, `Succesfully downloaded info about ${url}`);
							}
						},
					);
				}
			}
		}
	}
	return true;
};

const verifyPlaylistsIntegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking playlists)';
	const playlists = await getPlaylistsJSON();
	const playlistNames = Object.keys(playlists);
	const tracks = await getTracksJSON();
	const tracksIds = Object.keys(tracks);
	const tracksDirPath = await getFullPath('audio');
	const audioDir = await readDir(tracksDirPath);
	const allKeysFromAudioDir = audioDir.map(d => d.name);
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
			await alertAsync(title, `Repeat mode of playlist ${name} is not a number`);
		}
		if (!playlist.tracksIds || !('length' in playlist.tracksIds)) {
			await alertAsync(title, `Tracks of playlist ${name} is not an array`);
		}
		for (const id of playlist.tracksIds) {
			if (tracksIds && !tracksIds.find(k => k === id)) {
				await promptAboutMissingTrack(
					title,
					`Track ${id} in playlist ${name} is not in the audioData.json`,
					id,
					'info',
				);
			}
			if (allKeysFromAudioDir && !allKeysFromAudioDir.find(k => k === id)) {
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

const verifySDintegrity = async (): Promise<boolean> => {
	const title = 'Verifying integrity... (checking SDcard)';
	const settings = await getSettings();
	const sdpath = await SDDirectoryPath();
	if (sdpath && !settings.useSDcard) {
		for (const key in infoFilesName) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const name = (infoFilesName as any)[key];
			const filepath = `${sdpath}/${name}`;
			if (await exists(filepath)) {
				await alertAsyncAndSolveWith(
					title,
					`${filepath} exists but you are using the internal memory`,
					`Delete from sdcard`,
					async () => {
						await unlink(filepath).catch(handleErr);
					},
				);
			}
		}
	}
	return true;
};

export const verifyIntegrity = async (): Promise<void> => {
	let shouldContinue = true;
	shouldContinue = await verifyInitializationIntegrity().catch(() => false);
	if (shouldContinue) {
		shouldContinue = await verifySettingsIntegrity().catch(() => false);
	}
	if (shouldContinue) {
		shouldContinue = await verifyTracksIntegrity().catch(() => false);
	}
	if (shouldContinue) {
		shouldContinue = await verifyPlaylistsIntegrity().catch(() => false);
	}
	if (shouldContinue) {
		shouldContinue = await verifySDintegrity().catch(() => false);
	}
	if (!shouldContinue) {
		await alertAsync('Verification had to be aborted');
	} else {
		await alertAsync(`Verification complete`);
	}
};
