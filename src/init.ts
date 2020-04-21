import { initSettings, createFileStructure } from './services/settings';

(async () => {
	await initSettings();
	await createFileStructure();
})();
