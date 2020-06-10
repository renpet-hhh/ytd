import { Settings, InternalSettings } from 'src/types/data';
import {
	writeFile,
	readFile,
	getAllExternalFilesDirs,
	DocumentDirectoryPath,
	exists,
	mkdir,
	moveFile,
	readDir,
} from 'react-native-fs';
import { Alert } from 'react-native';

const settingsPath = DocumentDirectoryPath + '/settings.json';
export const getSettings = async (): Promise<Settings> => {
	return JSON.parse(await readFile(settingsPath));
};
export const setSettings = async (settings: Settings): Promise<void> => {
	await writeFile(settingsPath, JSON.stringify(settings));
};

export const SDDirectoryPath = async (): Promise<string | null> => {
	const dirs = await getAllExternalFilesDirs();
	if (!dirs?.[0]) {
		console.warn(`Couldn't find path to internal storage`);
		return null;
	}
	return dirs[1] ? dirs[1] : null;
};
/** Adds the correct prefix to path, depending on whether the user is using the sdcard */
export const getFullPath = async (path: string, settings?: Settings): Promise<string> => {
	if (path.startsWith('/')) {
		throw Error(`path ${path} starts with /`);
	}
	const sdPath = await SDDirectoryPath();
	if (!sdPath) {
		return `${DocumentDirectoryPath}/${path}`;
	}
	const { useSDcard } = settings ?? (await getSettings());
	return `${useSDcard ? sdPath : DocumentDirectoryPath}/${path}`;
};
export const infoFilesName = {
	audioData: 'audioData.json',
	playlistData: 'playlists.json',
	internalSettings: 'internal-settings.json',
};
export const getInfoFilePath = async (name: keyof typeof infoFilesName): Promise<string> => {
	return await getFullPath(infoFilesName[name]);
};

export const initSettings = async (): Promise<void> => {
	if (!(await exists(settingsPath))) {
		await writeFile(settingsPath, JSON.stringify({}));
	}
	const settings = await getSettings();
	if (settings.server === undefined) settings.server = '';
	const canUseSDCard = !!(await SDDirectoryPath());
	if (settings.useSDcard === undefined || !canUseSDCard) {
		settings.useSDcard = canUseSDCard;
	}
	await setSettings(settings);
};

export const setInternalSettings = async (internalSettings: InternalSettings): Promise<void> => {
	const internalSettingsPath = await getInfoFilePath('internalSettings');
	await writeFile(internalSettingsPath, JSON.stringify(internalSettings));
};
export const getInternalSettings = async (): Promise<InternalSettings> => {
	const internalSettingsPath = await getInfoFilePath('internalSettings');
	return JSON.parse(await readFile(internalSettingsPath));
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
	// Create information files if they don't exist
	for (const name in infoFilesName) {
		const filePath = await getInfoFilePath(name as keyof typeof infoFilesName);
		if (!(await exists(filePath))) {
			await writeFile(filePath, JSON.stringify({}));
		}
	}
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
			moveFileStructure(dir.path, to + dir.name + '/', overwrite);
		} else {
			const origPath = dir.path;
			const destPath = to + dir.name;
			// settings.json shouldn't move
			if (
				origPath === settingsPath ||
				destPath === settingsPath ||
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

