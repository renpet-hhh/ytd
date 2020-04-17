import { useState, useEffect } from 'react';
import { getInternalSettings } from 'src/services/settings';
import TrackPlayer from 'react-native-track-player';

interface Return {
	trackBeingPlayed: string | null | undefined;
	playlistBeingPlayed: string | null | undefined;
}
const useCurrentPlaying = (): Return => {
	const [trackBeingPlayed, setTrackBeingPlayed] = useState<string | null | undefined>(undefined);
	const [playlistBeingPlayed, setPlaylistBeingPlayed] = useState<string | null | undefined>(
		undefined,
	);
	useEffect(() => {
		TrackPlayer.getCurrentTrack().then(t => {
			TrackPlayer.getState().then(state => {
				if (state !== TrackPlayer.STATE_STOPPED) {
					setTrackBeingPlayed(t);
				}
			});
		});
		getInternalSettings().then(s => setPlaylistBeingPlayed(s.currentPlaylist?.name ?? null));
		const subs = [
			TrackPlayer.addEventListener('playback-track-changed', ({ nextTrack }) => {
				if (nextTrack) {
					setTrackBeingPlayed(nextTrack);
				}
			}),
			TrackPlayer.addEventListener('playback-queue-ended', ({ track }) => {
				if (track) {
					setTrackBeingPlayed(null);
					setPlaylistBeingPlayed(null);
				}
			}),
			TrackPlayer.addEventListener('playback-state', ({ state }) => {
				if (state === TrackPlayer.STATE_STOPPED) {
					setTrackBeingPlayed(null);
					setPlaylistBeingPlayed(null);
				} else if (state === TrackPlayer.STATE_PLAYING) {
					getInternalSettings().then(settings => {
						setPlaylistBeingPlayed(settings.currentPlaylist?.name ?? null);
					});
				}
			}),
		];
		return () => subs.forEach(sub => sub.remove());
	}, []);
	return { trackBeingPlayed, playlistBeingPlayed };
};

export default useCurrentPlaying;
