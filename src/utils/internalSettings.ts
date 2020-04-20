import { Playlist } from 'src/types/data';
import { getInternalSettings, setInternalSettings } from 'src/services/settings';

export const updateCurrentPlaylist = async (
	name: string | null,
	playlist: Playlist,
): Promise<void> => {
	const internalSettings = await getInternalSettings();
	internalSettings.currentPlaylist = {
		name,
		repeat: playlist.repeat,
	};
	await setInternalSettings(internalSettings);
};
