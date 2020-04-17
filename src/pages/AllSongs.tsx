import React, { useRef, useCallback, useEffect } from 'react';
import LocalTrackList from 'src/components/specific/LocalTrackList';
import { Text, StyleSheet, Dimensions, View, BackHandler, Alert, ScrollView } from 'react-native';
import colors from 'src/constants/colors';
import { TrackData } from 'src/types/data';
import { deleteTrack } from 'src/services/download';
import useMultiselect from 'src/hooks/useMultiselect';
import SelectMenu from 'src/components/generic/SelectMenu';
import { ExtractRef } from 'src/types/utils';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenProps } from 'src/types/navigation';
import useEventCallback from 'src/hooks/useEventCallback';
import IconButton from 'src/components/generic/IconButton';
import { playPlaylist } from 'src/services/playlist';
import { downloadTrack } from 'src/services/download';

type Props = ScreenProps<'AllSongs'> & {
	/** Initially it should be the empty string or null. When the download succeeds,
	 * it should be set to the empty string or null (force a update),
	 * when the download fails, it should be set to the url to retry.
	 */
	urlToRetry: string | null;
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.BROWN,
		flex: 1,
		alignItems: 'center',
	},
	retryDownloadContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 50,
	},
	retryDownwloadIcon: {
		fontSize: 46,
		marginRight: 5,
		color: colors.SUN,
	},
	retryDownloadText: {
		fontSize: 24,
		color: colors.GOLD,
	},
	scrollView: {},
	scrollViewContentContainer: {
		padding: 20,
	},
	listContainer: {
		marginVertical: 100,
		flexDirection: 'column',
	},
	track: {
		backgroundColor: colors.BROWN,
		width: Dimensions.get('window').width * 0.8,
		padding: 8,
	},
	trackText: {
		color: colors.WHITE,
		fontSize: 15,
	},
	selectedTrack: {
		backgroundColor: colors.DEAD_PURPLE,
	},
});
// class Static {
// 	static LAST_SHARED_URL: string | null = null;
// }
const AllSongs = ({ navigation, urlToRetry }: Props): JSX.Element => {
	const localTracklistRef: ExtractRef<typeof LocalTrackList> = useRef(null);
	const [selected, setSelected, onSelectChange] = useMultiselect<string>();
	const deselectAll = useCallback((): void => {
		setSelected(new Set());
	}, [setSelected]);
	const onDeleteSelect = useEventCallback((): void => {
		deleteTrack(selected).then(() => {
			deselectAll();
			localTracklistRef.current?.refresh();
		});
	});
	const onPressTrack = useCallback(async (id: string, track: TrackData | undefined): Promise<
		void
	> => {
		if (!track) {
			Alert.alert(
				'Error',
				"Could' find the track, try deleting and downloading it again",
				[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
				{ cancelable: true },
			);
			return;
		}
		await playPlaylist(null, { singleTrack: id });
	}, []);

	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener('hardwareBackPress', (): boolean => {
				if (selected.size > 0) {
					deselectAll();
					return true;
				}
				if (!navigation.canGoBack()) {
					navigation.replace('Home');
					return true;
				}
				return false;
			});
			return () => {
				sub.remove();
			};
		}, [selected.size, navigation, deselectAll]),
	);
	useEffect(() => {
		if (urlToRetry === null || urlToRetry === '') localTracklistRef.current?.refresh();
	}, [urlToRetry]);
	const retryDownload = useCallback(() => {
		if (urlToRetry) downloadTrack(urlToRetry).catch(() => null);
	}, [urlToRetry]);
	return (
		<View style={styles.container}>
			{!!urlToRetry && (
				<View style={styles.retryDownloadContainer}>
					<IconButton
						touchableFlex={1}
						iconStyle={styles.retryDownwloadIcon}
						textStyle={styles.retryDownloadText}
						name="get-app"
						onPress={retryDownload}>
						Retry to download
					</IconButton>
				</View>
			)}
			<SelectMenu
				icons={['delete']}
				onClear={deselectAll}
				onPress={[onDeleteSelect]}
				visible={selected.size > 0}
			/>
			<View style={styles.listContainer}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollViewContentContainer}
					overScrollMode="always">
					<LocalTrackList
						selected={selected}
						onSelect={onSelectChange}
						ref={localTracklistRef}
						onPress={onPressTrack}
						textContainerStyle={styles.track}
						textStyle={styles.trackText}
						selectedTextContainerStyle={styles.selectedTrack}
						renderWhenEmpty={<Text>Nothing here</Text>}
					/>
				</ScrollView>
			</View>
		</View>
	);
};

export default AllSongs;