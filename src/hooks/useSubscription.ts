import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/** We want cb to be called when screen is initialized by a SHARE intent from YouTube.
 * However, cb cannot be called after it was already called.
 * For that purpose, we will initialize shouldRunRef to true and it'll be automatically
 * set to false by the handler. Also, we initialize sharedUrlRef to sharedUrl,
 * and, when `sharedUrl !== sharedUrlRef.current`, we update sharedUrlRef to the current value
 * of sharedUrl and update shouldRunRef to true.
 * Will this give us the behavior that we want?
 * We want cb to be called every time Youtube launches or updates App with a new sharedUrl
 * but we want cb NOT be called in any other scenario.
 * The scenarios are transitions, and they have three variables:
 * - Who launched the app (doesn't matter if app was 'updated', we only want to know the value of the previous sharedUrl).
 * - Whether the app is being unmounted or just updated.
 * - Who is relaunching/updating the app.
 *
 * Let's see all possible scenarios:
 * - The app (in any previous state) unmounts and is launched by the user.
 * shouldRunRef is true, but sharedUrlRef.current is undefined. Thus, cb won't run.
 * - The app (in any previous state) unmounts and is launched by Youtube.
 * shouldRunRef is true and sharedUrlRef.current is undefined. Because sharedUrl is not undefined,
 * sharedUrl !== sharedUrlRef.current and sharedUrlRef will be updated to sharedUrl.
 * - The app (launched by the user) goes to background and returns because user returned to it (the app didn't unmount).
 * shouldRunRef is false and handler correctly won't call cb.
 * - The app (launched by the user) goes to background and returns
 * because of an Youtube SHARE intent (the app didn't unmount).
 * shouldRunRef is false, but we want it to be true... Since the app didn't unmount, sharedUrlRef.current is undefined (because previous
 * sharedUrl was undefined). We know that sharedUrl is NOT undefined (because Youtube launched the app)
 * and sharedUrlRef.current is undefined. Thus, they are different and then shouldRunRef is set
 * to true and sharedUrlRef is updated.
 * - The app (launched by Youtube) goes to background and returns because user returned to it (app didn't unmount).
 * shouldRunRef is false and that's what we want. Since sharedUrlRef.current is not undefined
 * and sharedUrl === undefined, `sharedUrl !== sharedUrlRef.current`. Then, we will set shouldRunRef.current
 * to true... But that's okay because sharedUrlRef will be updated to undefined, which
 * will cause the handler not to run cb.
 * - The app (launched by Youtube) goes to background and returns because of another Youtube
 * SHARE intent (the app didn't unmount).
 * shouldRunRef is false, but we want it to be true... Since the app didn't unmount,
 * sharedUrlRef.current is the previous sharedUrl (because previous sharedUrl initialized sharedUrlRef),
 * and sharedUrl is another value now (assuming user shared another url). Thus, since
 * `sharedUrl !== sharedUrlRef.current`, we will set shouldRunRef to true. Also, the event handler
 * will use the updated value (sharedUrl), which is what we want.
 */
const useSharedUrlSubscription = (
	cb: (value: AppStateStatus, sharedUrl: string) => void,
	sharedUrl?: string,
): void => {
	const shouldRunRef = useRef(true);
	const sharedUrlRef = useRef(sharedUrl);
	if (sharedUrl !== sharedUrlRef.current) {
		sharedUrlRef.current = sharedUrl;
		shouldRunRef.current = true;
	}
	useEffect(() => {
		const handler = (v: AppStateStatus): void => {
			if (!shouldRunRef.current || !sharedUrlRef.current) return;
			shouldRunRef.current = false;
			cb(v, sharedUrlRef.current);
		};
		AppState.addEventListener('change', handler);
		return () => {
			AppState.removeEventListener('change', handler);
		};
	}, [cb]);
};
export default useSharedUrlSubscription;
