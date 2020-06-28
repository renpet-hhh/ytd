import BuildSelectableList from 'src/components/high-order/SelectableList';
import { getTracks } from 'src/services/track';

export default BuildSelectableList({
	getData: getTracks,
	dataToText: (_key, track) => (track ? track.title : 'information for this track is corrupted'),
});
