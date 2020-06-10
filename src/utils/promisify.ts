import { Alert, AlertButton, AlertOptions } from 'react-native';

export const alertAsync = (
	title: string,
	message?: string,
	buttons?: AlertButton[],
	options?: AlertOptions,
): Promise<string | undefined> => {
	return new Promise(resolve => {
		if (!buttons) {
			buttons = [
				{
					text: 'OK',
				},
			];
		}
		buttons = buttons.map(b => ({
			...b,
			onPress: v => {
				b.onPress?.(v);
				resolve(b.text);
			},
		}));
		if (!options) {
			options = {};
		}
		options.onDismiss = () => {
			options?.onDismiss?.();
			resolve();
		};
		Alert.alert(title, message, buttons, options);
	});
};

export const alertAsyncAndSolveWith = async (
	title: string,
	message: string,
	solutionMessage: string,
	solution: () => Promise<void>,
): Promise<void> => {
	const prompt = await alertAsync(title, message, [
		{
			text: 'Ignore',
		},
		{
			text: solutionMessage,
		},
	]);
	if (prompt === solutionMessage) {
		await solution();
	}
};
