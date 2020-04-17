import { useRef } from 'react';

const areDeepEqual = (arr1: unknown[], arr2: unknown[]): boolean => {
	for (const elem1 of arr1) {
		for (const elem2 of arr2) {
			if (elem1 !== elem2) return false;
		}
	}
	return true;
};
const useDerived = <T>(cb: () => T, deps: unknown[]): T => {
	const stateRef = useRef<T>(cb());
	const prevDepsRef = useRef<unknown[]>(deps);
	if (!areDeepEqual(deps, prevDepsRef.current)) {
		stateRef.current = cb();
		prevDepsRef.current = deps;
	}
	return stateRef.current;
};

export default useDerived;
