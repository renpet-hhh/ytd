import { useCallback } from 'react';

interface Swap<T> {
	(x: T, move: number): void;
}

const useSetSwap = <T>(setTracks: React.Dispatch<React.SetStateAction<Set<T>>>): Swap<T> =>
	useCallback(
		(x: T, move: number) => {
			setTracks(currTracks => {
				const arr = [...currTracks];
				const xIndex = arr.findIndex(t => t === x);
				let yIndex = xIndex + move;
				if (yIndex >= currTracks.size) yIndex = currTracks.size - 1;
				if (yIndex < 0) yIndex = 0;
				const temp = arr[yIndex];
				arr[yIndex] = arr[xIndex];
				arr[xIndex] = temp;
				return new Set(arr);
			});
		},
		[setTracks],
	);

export default useSetSwap;
