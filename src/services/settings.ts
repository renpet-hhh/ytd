import { Settings, InternalSettings } from 'src/types/data';
import { getAllExternalFilesDirs, DocumentDirectoryPath } from 'react-native-fs';
import { setData, getData } from './fs';

export const setSettings = async (settings: Partial<Settings>): Promise<void> => {
	await setData(settings, 'settings@');
};
export const getSettings = async (): Promise<Settings> => {
	return await getData('settings@');
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

export const initSettings = async (): Promise<void> => {
	const settings = await getSettings();
	if (settings.server === undefined) settings.server = '';
	const canUseSDCard = !!(await SDDirectoryPath());
	if (settings.useSDcard === undefined || !canUseSDCard) {
		settings.useSDcard = canUseSDCard;
	}
	await setSettings(settings);
};

export const setInternalSettings = async (internalSettings: InternalSettings): Promise<void> => {
	await setData(internalSettings, 'internalSettings@');
};
export const getInternalSettings = async (): Promise<InternalSettings> => {
	return await getData('internalSettings@');
};
