import BuildSelectableList from 'src/components/high-order/SelectableList';
import { getPlaylistsJSON } from 'src/services/playlist';

export default BuildSelectableList({
	getData: getPlaylistsJSON,
	dataToText: key => key,
});
