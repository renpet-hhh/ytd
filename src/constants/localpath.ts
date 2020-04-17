import {
	DocumentDirectoryPath,
	ExternalStorageDirectoryPath,
	exists,
	mkdir,
	writeFile,
} from 'react-native-fs';
import { check, PERMISSIONS, request } from 'react-native-permissions';

const SDDirectoryPath = `${ExternalStorageDirectoryPath}/ytd`;
export const writeExternalStoragePermission = check(
	PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
).then(status => {
	if (status === 'denied') {
		return request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
	}
	return status;
});
const directoryStructure = {
	audio: null,
	temp: null,
};
/** Adds the correct prefix to path, depending on whether the user gave external sd write permission */
export const getFullPath = async (path: string): Promise<string> => {
	if (!path.startsWith('/')) throw Error(`path should start with /, given path was ${path}`);
	const permissionStatus = await writeExternalStoragePermission;
	if (permissionStatus === 'granted') {
		return `${SDDirectoryPath}${path}`;
	}
	return `${DocumentDirectoryPath}${path}`;
};
const infoFilesName = {
	audioData: 'audioData.json',
	playlistData: 'playlists.json',
	settings: 'settings.json',
	internalSettings: 'internal-settings.json',
};
export const getInfoFilePath = async (name: keyof typeof infoFilesName): Promise<string> => {
	if (!(name in infoFilesName)) throw Error(`No file is attached to the name ${name}`);
	const permissionStatus = await writeExternalStoragePermission;
	if (permissionStatus === 'granted') {
		return `${SDDirectoryPath}/${infoFilesName[name]}`;
	}
	return `${DocumentDirectoryPath}/${infoFilesName[name]}`;
};
const mkAllDirsIn = async (obj: object, root: string): Promise<void> => {
	for (const key in obj) {
		const currPath = `${root}/${key}`;
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
	const sdPermission = await writeExternalStoragePermission;
	// Create directories if they don't exist
	await mkAllDirsIn(
		directoryStructure,
		sdPermission === 'granted' ? SDDirectoryPath : DocumentDirectoryPath,
	);
	// Create information files if they don't exist
	for (const name in infoFilesName) {
		const filePath = await getInfoFilePath(name as keyof typeof infoFilesName);
		if (!(await exists(filePath))) {
			await writeFile(filePath, JSON.stringify({}));
		}
	}
};
