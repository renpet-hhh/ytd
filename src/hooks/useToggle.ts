import { useState } from 'react';

const useToggle = (initialValue: boolean): [boolean, () => void] => {
	const [active, setActive] = useState(initialValue);
	const toggle = (): void => {
		setActive(!active);
	};
	return [active, toggle];
};

export default useToggle;
