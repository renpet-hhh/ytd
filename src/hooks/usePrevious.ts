import { useEffect, useRef } from 'react';

const usePrevious = <T>(spy: T): T => {
	const previous = useRef(spy);
	useEffect(() => {
		if (spy !== previous.current) previous.current = spy;
	}, [spy]);
	return previous.current;
};

export default usePrevious;
