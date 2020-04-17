const errors = {
	PLAYLIST: {
		CREATE: {
			ALREADY_EXISTS: 'Playlist already exists',
			EMPTY_IS_INVALID: 'Playlist must have a name',
		},
	},
	AUDIO: {
		DOWNLOAD: {
			ALREADY_EXISTS: 'This audio is already downloaded',
			FAILED: 'Download failed',
			INFO: {
				MISSING: 'Downloaded info is missing required fields',
			},
		},
	},
	INTERNAL: {
		SETTING_NAME_IS_INVALID: 'No setting with the name specified exists',
		FAILED_ASSERTION: 'Some assertion is false',
	},
};
export default errors;
