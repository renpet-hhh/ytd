import errors from 'src/constants/errors';
import { getSettings } from 'src/services/settings';

export const extractIdFromURL = (url: string): string => {
	const firstAmpersand = url.indexOf('&');
	const id = url
		.slice(url.indexOf('v='), firstAmpersand === -1 ? undefined : firstAmpersand)
		.slice(2);
	return id;
};

export const getServerDownloadPath = async (
	service: 'audio' | 'info',
	url: string,
): Promise<string> => {
	const serverDomain = (await getSettings()).server;
	let domain = !serverDomain ? process.env.BACKEND_URL_ROOT : serverDomain;
	if (!domain) {
		throw Error(`Server domain can't be empty`);
	}
	if (domain.endsWith('/')) domain = domain.slice(0, -1);
	switch (service) {
		case 'audio':
			return `${domain}/api/getaudio?url=${encodeURIComponent(url)}`;
		case 'info':
			return `${domain}/api/getaudioinfo?url=${encodeURIComponent(url)}`;
		default:
			throw Error(errors.INTERNAL.FAILED_ASSERTION);
	}
};
