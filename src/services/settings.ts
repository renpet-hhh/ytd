import { Settings, InternalSettings } from 'src/types/data';
import { writeFile, readFile } from 'react-native-fs';
import { getInfoFilePath } from 'src/constants/localpath';

export const getSettings = async (): Promise<Settings> => {
	const settingsPath = await getInfoFilePath('settings');
	return JSON.parse(await readFile(settingsPath));
};
export const setSettings = async (settings: Settings): Promise<void> => {
	const settingsPath = await getInfoFilePath('settings');
	await writeFile(settingsPath, JSON.stringify(settings));
};
export const setInternalSettings = async (internalSettings: InternalSettings): Promise<void> => {
	const internalSettingsPath = await getInfoFilePath('internalSettings');
	await writeFile(internalSettingsPath, JSON.stringify(internalSettings));
};
export const getInternalSettings = async (): Promise<InternalSettings> => {
	const internalSettingsPath = await getInfoFilePath('internalSettings');
	return JSON.parse(await readFile(internalSettingsPath));
};
