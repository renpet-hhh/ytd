import TrackPlayer from 'react-native-track-player';
import { useState, useEffect } from 'react';
interface UseTrackPlayerProgressReturn {
	position: number;
	bufferedPosition: number;
	duration: number;
}
const useTrackPlayerProgress = (shouldUpdate: boolean): UseTrackPlayerProgressReturn => {
	const [progress, setProgress] = useState({ position: 0, bufferedPosition: 0, duration: 0 });
	useEffect(() => {
		if (!shouldUpdate) return;
		const run = async (): Promise<void> => {
			setProgress({
				position: await TrackPlayer.getPosition(),
				bufferedPosition: await TrackPlayer.getBufferedPosition(),
				duration: await TrackPlayer.getDuration(),
			});
		};
		const intervalID = setInterval(() => {
			run();
		}, 1000);
		return () => clearInterval(intervalID);
	}, [shouldUpdate]);
	return progress;
};

export default useTrackPlayerProgress;
