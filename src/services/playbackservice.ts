import TrackPlayer from 'react-native-track-player';
import { Alert } from 'react-native';

export default async (): Promise<void> => {
	await TrackPlayer.setupPlayer();
	TrackPlayer.updateOptions({
		capabilities: [
			TrackPlayer.CAPABILITY_PLAY,
			TrackPlayer.CAPABILITY_PAUSE,
			TrackPlayer.CAPABILITY_STOP,
			TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
			TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
		],
	});
	class Static {
		static USER_ASKED_TO_SKIP_TRACK = false;
	}

	TrackPlayer.addEventListener('remote-play', () => {
		TrackPlayer.play();
	});

	TrackPlayer.addEventListener('remote-pause', () => {
		TrackPlayer.pause();
	});

	TrackPlayer.addEventListener('remote-stop', () => {
		TrackPlayer.destroy();
	});

	TrackPlayer.addEventListener('remote-next', () => {
		Static.USER_ASKED_TO_SKIP_TRACK = true;
		TrackPlayer.skipToNext().catch(() => {
			Alert.alert('No next track');
			Static.USER_ASKED_TO_SKIP_TRACK = false;
		});
	});

	TrackPlayer.addEventListener('remote-previous', () => {
		Static.USER_ASKED_TO_SKIP_TRACK = true;
		TrackPlayer.skipToPrevious().catch(() => {
			Alert.alert('No previous track');
			Static.USER_ASKED_TO_SKIP_TRACK = false;
		});
	});

	TrackPlayer.addEventListener('playback-error', ({ code, message }) => {
		console.log({ code, message });
	});
};
