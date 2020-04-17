import { useRef, useLayoutEffect, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useEventCallback = (fn: () => any): (() => void) => {
	const ref = useRef<() => void>();
	useLayoutEffect(() => {
		ref.current = fn;
	});
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	//@ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return useCallback(() => (0, ref.current!)(), []);
};

export default useEventCallback;
