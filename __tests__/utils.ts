import { act as importedAct, flushMicrotasksQueue } from 'react-native-testing-library';

// importedAct has inaccurate type
export const act = async (callback: (() => Promise<void>) | (() => void)): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	await importedAct(callback);
};

export const flush = async (): Promise<void> => {
	await act(
		async (): Promise<void> => {
			await flushMicrotasksQueue();
		},
	);
};
