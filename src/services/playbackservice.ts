import TrackPlayer from 'react-native-track-player';
import { Alert } from 'react-native';
import { getInternalSettings } from './settings';

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

	TrackPlayer.addEventListener('playback-track-changed', ({ nextTrack, position, track }) => {
		const run = async (): Promise<void> => {
			const internalSettings = await getInternalSettings();
			const { shouldIgnoreTrackChanged, currentPlaylist } = internalSettings;
			if (shouldIgnoreTrackChanged) return;
			if (nextTrack === track) {
				// ids are unique, so that means that the queue changed while a track was playing
				// and that track is trying to replay itself, we'll only repeat it if repeatMode === 'track'
			}
			const repeatMode = currentPlaylist?.repeat;
			/** Whether to skipToPrevious.
			 * How can we repeat a track?
			 * * You might think that calling TrackPlayer.skip(await TrackPlayer.getCurrentTrack())
			 * would do. However, the playback-track-changed event only fires when track changes,
			 * so the current track is not the track that we should replay. Instead, the desired track
			 * is the previous one. However, calling TrackPlayer.skipToPrevious() will change the track,
			 * and this handler will be called again, and since repeatMode is still 'track' and (let's
			 * assume that user didn't asked to skip the track) Static.USER_ASKED_TO_SKIP_TRACK is false,
			 * this handler will call TrackPlayer.skipToPrevious() in the track that we wanted to repeat!
			 * So, we must know when we are at the desired track, and that's the purpose of the
			 * shouldSkipToPrevious variable below.
			 * ----------------------
			 * Let's assume all tracks have duration greater than 3 seconds.
			 * * If position <= 3, the previous track hasn't reached its end, so it means
			 * that this playback-track-changed event was triggered by this own handler,
			 * (since this handler calls skipToPrevious)
			 * so we must consider that we are currently at the desired track.
			 * You might think that position could be <= 3 because the user pressed the
			 * next or previous buttons in the start of the track, but if so,
			 * Static.USER_ASKED_TO_SKIP_TRACK is true and then this handler won't interfere,
			 * since the responsibility to skip is on the handlers that capture the remote-next or
			 * remote-previous events.
			 */
			const shouldSkipToPrevious = position > 3;
			if (
				repeatMode === 'track' &&
				shouldSkipToPrevious &&
				!Static.USER_ASKED_TO_SKIP_TRACK
			) {
				await TrackPlayer.skipToPrevious().catch(() => null);
				return;
			}
			Static.USER_ASKED_TO_SKIP_TRACK = false;
		};
		run();
	});
	TrackPlayer.addEventListener('playback-queue-ended', ({ track }) => {
		const run = async (): Promise<void> => {
			const queue = await TrackPlayer.getQueue();
			const state = await TrackPlayer.getState();
			if (queue.length === 0 || state !== TrackPlayer.STATE_STOPPED) return;
			const playlist = (await getInternalSettings()).currentPlaylist;
			const repeatMode = playlist?.repeat;
			if (repeatMode === 'playlist') {
				await TrackPlayer.reset();
				await TrackPlayer.add(queue);
				await TrackPlayer.play();
			} else if (repeatMode === 'track') {
				/** The queue ended in the 'track' repeatMode, so we should replay the last track */
				await TrackPlayer.skip(track).catch(() => null);
				return;
			}
		};
		run();
	});

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
