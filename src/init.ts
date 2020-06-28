import { initSettings } from './services/settings';
import { createFileStructure } from './services/fs';

(async () => {
	await initSettings();
	await createFileStructure();
})();
