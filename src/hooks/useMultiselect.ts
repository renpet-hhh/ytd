import { useState, useRef, useCallback } from 'react';
type Return<T> = [Set<T>, React.Dispatch<React.SetStateAction<Set<T>>>, (x: T) => void];

const useMultiselect = <T>(
	equality: (x: T, y: T) => boolean = (x, y): boolean => x === y,
): Return<T> => {
	const equalityRef = useRef(equality);
	const [selected, setSelected] = useState<Set<T>>(new Set());
	const onSelectChange = useCallback((changed: T): void => {
		setSelected(currSelected => {
			const isSelected = (y: T): boolean => {
				for (const currentlySelected of currSelected) {
					if (equalityRef.current(y, currentlySelected)) return true;
				}
				return false;
			};
			if (isSelected(changed)) {
				return new Set([...currSelected].filter(x => !equalityRef.current(x, changed)));
			} else {
				return new Set([...currSelected, changed]);
			}
		});
	}, []);
	return [selected, setSelected, onSelectChange];
};

export default useMultiselect;
