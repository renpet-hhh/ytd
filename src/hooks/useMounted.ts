import { useRef, useEffect } from 'react';

const useMounted = (): boolean => {
	const isMounted = useRef(false);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);
	return isMounted.current;
};

export default useMounted;
