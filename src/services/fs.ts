/**
 * The app storage is implemented by AsyncStorage
 *
 * Data about a same topic (i.e. playlist) are prefixed with that topic
 * Currently, there are 4 topics:
 * - settings, internalSettings, track, playlist
 *
 * All the following keys MUST exist:
 * - settings@useSDcard
 * - settings@server
 * - internalSettings@currentPlaylist
 *
 * Additionaly, for every track with id K, there exists the key track@K
 * The value got from that key is a string, that when deserialized (JSON.parse) follows the interface Playlist
 *
 * For every playlist with name N, there exists the key playlist@N
 * The value got from that key is a string, that when deserialized (JSON.parse) follows the interface TrackData
 *
 *
 */
import AsyncStorage from '@react-native-community/async-storage';
import { exists, mkdir, readDir, moveFile, DocumentDirectoryPath } from 'react-native-fs';
import { getFullPath, getSettings, SDDirectoryPath, setSettings } from './settings';
import { Alert } from 'react-native';

/**
 * Saves data to AsyncStorage
 * @param data Object with key-value mapping to be saved in AsyncStorage
 * @param prefix Prefix to add to every key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setData = async (data: any, prefix: string): Promise<void> => {
	const edits = [];
	for (const k in data) {
		const value = data[k];
		edits.push([prefix + k, JSON.stringify(value)]);
	}
	await AsyncStorage.multiSet(edits);
};

/**
 * Gets a object that maps keys to values according to each key-value pair that starts with prefix
 * and is saved in AsyncStorage
 * @param prefix
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getData = async (prefix: string): Promise<any> => {
	const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(prefix));
	const values = await AsyncStorage.multiGet(keys);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data: any = {};
	for (const [k, v] of values) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		data[k.substr(prefix.length)] = JSON.parse(v!);
	}
	return data;
};
export const hasKey = async (key: string): Promise<boolean> => {
	const item = await AsyncStorage.getItem(key).catch(() => null);
	return item !== null;
};

const directoryStructure = {
	audio: null,
	temp: null,
};

const mkAllDirsIn = async (obj: object, root: string): Promise<void> => {
	for (const key in obj) {
		const currPath = `${root}${key}`;
		if (!(await exists(currPath))) {
			await mkdir(currPath);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nested = (obj as any)[key];
		// careful, typeof null === 'object'
		if (typeof nested === 'object' && !!nested) {
			await mkAllDirsIn(nested, currPath);
		}
	}
};
export const createFileStructure = async (): Promise<void> => {
	// Create directories if they don't exist
	await mkAllDirsIn(directoryStructure, await getFullPath(''));
};
/** Both paths must end with a / */
const moveFileStructure = async (from: string, to: string, overwrite: boolean): Promise<void> => {
	if (!(await exists(to))) {
		await mkdir(to);
	}
	const filesThatWillBeOverwritten = [];
	const filesThatShouldBeMoved: [string, string][] = [];
	const dirs = await readDir(from);
	for (const dir of dirs) {
		if (dir.isDirectory()) {
			await moveFileStructure(dir.path, to + dir.name + '/', overwrite);
		} else {
			const origPath = dir.path;
			const destPath = to + dir.name;
			// dev bundle shouldn't move
			if (
				origPath.endsWith('ReactNativeDevBundle.js') ||
				destPath.endsWith('ReactNativeDevBundle.js')
			)
				continue;
			if (overwrite) {
				await moveFile(origPath, destPath).catch(() => {
					console.log('Error while moving ' + origPath + '. Probably a temporary file');
				});
			} else {
				if (await exists(destPath)) {
					filesThatWillBeOverwritten.push(destPath);
				} else {
					filesThatShouldBeMoved.push([origPath, destPath]);
				}
			}
		}
	}
	if (!overwrite) {
		if (filesThatWillBeOverwritten.length > 0) {
			throw filesThatWillBeOverwritten;
		} else {
			for (const [origPath, destPath] of filesThatShouldBeMoved) {
				console.log(origPath + ' -> ' + destPath);
				await moveFile(origPath, destPath).catch(() => {
					console.log('Error while moving ' + origPath + '. Probably a temporary file');
				});
			}
		}
	}
};
/** Resolves to true if cancelled */
const handledMoveFileStructure = (from: string, to: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		moveFileStructure(from, to, false)
			.then(() => {
				resolve(false);
			})
			.catch(filesThatWillBeOverwritten => {
				if (filesThatWillBeOverwritten.length > 0) {
					Alert.alert(
						'Warning',
						`This operation will overwrite some files. Are you sure that you want to continue?\nFiles that will be overwritten:\n${filesThatWillBeOverwritten}`,
						[
							{
								text: 'Cancel',
								onPress: () => {
									resolve(true);
								},
							},
							{
								text: 'Yes',
								onPress: async () => {
									await moveFileStructure(from, to, true);
									resolve(false);
								},
							},
						],
						{
							onDismiss: () => {
								resolve(true);
							},
						},
					);
				} else {
					reject(filesThatWillBeOverwritten);
				}
				return true;
			});
	});
};

export const changeStorageMount = async (): Promise<void> => {
	const settings = await getSettings();
	const currentMount = await getFullPath('', settings);
	if (settings.useSDcard) {
		const wasCancelled = await handledMoveFileStructure(
			currentMount,
			DocumentDirectoryPath + '/',
		);
		if (wasCancelled) return;
	} else {
		const sdpath = await SDDirectoryPath();
		if (sdpath === null) {
			throw Error(`No sdcard found`);
		}
		const wasCancelled = await handledMoveFileStructure(currentMount, sdpath + '/');
		if (wasCancelled) return;
	}
	settings.useSDcard = !settings.useSDcard;
	await setSettings(settings);
};
