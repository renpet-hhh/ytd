import { useState, useEffect } from 'react';

const useResolve = <T>(promise: Promise<T>): T | null => {
	const [state, setState] = useState<T | null>(null);
	useEffect(() => {
		promise.then(x => {
			setState(x);
		});
	}, [promise]);
	return state;
};

export default useResolve;
