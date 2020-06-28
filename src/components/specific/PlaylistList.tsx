import BuildSelectableList from 'src/components/high-order/SelectableList';
import { getPlaylists } from 'src/services/playlist';

export default BuildSelectableList({
	getData: getPlaylists,
	dataToText: key => key,
});
