import BuildSelectableList from 'src/components/high-order/SelectableList';
import { getTracksJSON } from 'src/services/download';

export default BuildSelectableList({
	getData: getTracksJSON,
	dataToText: (_key, track) => (track ? track.title : 'information for this track is corrupted'),
});
