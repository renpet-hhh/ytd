import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, BackHandler, Alert, ScrollView } from 'react-native';
import colors from 'src/constants/colors';
import IconButton from 'src/components/generic/IconButton';
import { ScreenProps } from 'src/types/navigation';
import LocalTrackList from 'src/components/specific/LocalTrackList';
import { useFocusEffect } from '@react-navigation/native';
import AbsoluteBackground from 'src/components/generic/AbsoluteBackground';
import { TrackData } from 'src/types/data';
import useMultiselect from 'src/hooks/useMultiselect';
import SelectMenu from 'src/components/generic/SelectMenu';
import {
	setPlaylistTracks,
	playPlaylist,
	getPlaylistsJSON,
	setPlaylistsJSON,
} from 'src/services/playlist';
import useSetSwap from 'src/hooks/useSetSwap';
import useEventCallback from 'src/hooks/useEventCallback';
import _ from 'lodash';
import {
	replaceQueue,
	convertTrackIdToReactKey,
	idFromReactKey,
	convertReactKeyToTrackId,
} from 'src/utils/player';
import useCurrentPlaying from 'src/hooks/useCurrentPlaying';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';

type Props = ScreenProps<'Playlist'> & {
	name: string;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.BACKGROUND_PURPLE,
		alignItems: 'center',
	},
	playlistNameText: {
		color: colors.WHITE,
		marginVertical: 20,
		fontSize: 30,
		textAlign: 'center',
	},
	playlistButtonsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'stretch',
		marginHorizontal: 20,
	},
	playlistButtonIcon: {
		fontSize: 42,
		padding: 5,
		color: colors.PINK,
	},
	scrollWrapper: {
		flex: 1,
	},
	scrollContentContainer: {
		padding: 20,
	},
	trackList: {
		marginTop: 50,
		width: Dimensions.get('window').width,
		borderColor: colors.BACKGROUND_PURPLE,
		borderWidth: 3,
	},
	trackContainer: {
		// padding is FORBIDDEN in this element due to bad UX
		// user could play track while trying to move tracks
		// add padding in child elements if you want
	},
	trackText: {
		color: colors.WHITE,
		fontSize: 16,
		padding: 8,
	},
	trackIcon: {
		color: colors.WHITE,
		fontSize: 36,
	},
	selectedPlaylistTrackContainer: {
		backgroundColor: colors.DEAD_PURPLE,
	},
	currentTrackText: {
		color: colors.SUN,
	},
	addNewContainer: {
		borderColor: colors.PINK,
		borderWidth: 2,
		marginTop: 30,
		marginBottom: 70,
		padding: 5,
		paddingRight: 8,
	},
	addNewIcon: {
		fontSize: 32,
		color: colors.PINK,
	},
	addNewText: {
		fontSize: 20,
		marginLeft: 15,
		color: colors.PINK,
	},
	trackToAddCenter: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	trackToAddContainer: {
		backgroundColor: colors.BLACK,
		width: Dimensions.get('window').width * 0.9,
		maxHeight: Dimensions.get('screen').height * 0.5,
		borderWidth: 2,
		borderColor: colors.SUN,
		borderRadius: 5,
		padding: 20,
	},
	trackToAdd: {
		marginVertical: 10,
		padding: 8,
	},
	trackToAddText: {
		fontSize: 16,
		color: colors.GOLD,
	},
	selectedTrackToAdd: {
		backgroundColor: colors.DEAD_PURPLE,
	},
	emptyPlaylistMessage: {
		color: colors.GOLD,
	},
});

const Playlist = ({ route }: Props): JSX.Element => {
	const { playlist, name } = route.params;
	const [tracks, setTracks] = useState(convertTrackIdToReactKey(playlist.tracksIds));
	const swapTracks = useSetSwap(setTracks);
	const localTracklistRef: React.ComponentPropsWithRef<typeof LocalTrackList>['ref'] = useRef(
		null,
	);
	const [visibleSelectTrackToAdd, setVisibleSelectTrackToAdd] = useState(false);

	const [selectedNewTracks, setSelectedNewTracks, onSelectChangeForNewTracks] = useMultiselect<
		string
	>();
	const [
		selectedPlaylistTracks,
		setSelectedPlaylistTracks,
		onSelectChangeForPlaylistTracks,
	] = useMultiselect<string>();
	const deselectAllNewTracks = useCallback((): void => {
		setSelectedNewTracks(new Set());
	}, [setSelectedNewTracks]);
	const deselectAllPlaylistTracks = useCallback((): void => {
		setSelectedPlaylistTracks(new Set());
	}, [setSelectedPlaylistTracks]);
	const { trackBeingPlayed, playlistBeingPlayed } = useCurrentPlaying();
	const [shouldSave, setShouldSave] = useState(false);
	const [repeatMode, setRepeatMode] = useState<RepeatMode>(playlist.repeat);
	const play = useCallback(
		_.debounce(
			async (id: string, track: TrackData | undefined, index: number): Promise<void> => {
				if (!track) {
					Alert.alert(
						'Error',
						"Couldn't find the track, try deleting and downloading it again",
						[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
						{ cancelable: true },
					);
					return;
				}
				// we should not set a initial repeat mode, since this internal setting
				// is already sync'd to this playlist's repeat mode value every time
				// this screen is mounted or the repeat mode button is clicked
				// that way, we won't need to rerender every list item just because
				// repeatMode changed
				await playPlaylist(name, { startBy: index, order: 'inOrder' });
			},
			500,
			{ leading: true, maxWait: 500 },
		),
		[name],
	);
	const openSelectMenuForNewTracks = useCallback(() => {
		setVisibleSelectTrackToAdd(true);
	}, []);
	const closeSelectMenuForNewTracks = useCallback(() => {
		deselectAllNewTracks();
		setVisibleSelectTrackToAdd(false);
	}, [deselectAllNewTracks]);
	const addSelectedNewTracks = useEventCallback(() => {
		setTracks(currTracks => {
			const updatedTracks = new Set(currTracks);
			for (const selectedKey of selectedNewTracks) {
				let count = 0;
				for (const key of currTracks) {
					if (idFromReactKey(key) === selectedKey) count++;
				}
				updatedTracks.add(`${selectedKey}/${count}`);
			}
			return updatedTracks;
		});
		deselectAllNewTracks();
		setShouldSave(true); // we don't have the updated tracks yet, wait for the state to change
	});
	const addPressedNewTrack = useCallback(
		(id: string) => {
			setTracks(currTracks => {
				let count = 0;
				for (const key of currTracks) {
					if (idFromReactKey(key) === id) count++;
				}
				return new Set([...currTracks, `${id}/${count}`]);
			});
			closeSelectMenuForNewTracks();
			setShouldSave(true); // we don't have the updated tracks yet, wait for the state to change
		},
		[closeSelectMenuForNewTracks],
	);
	const deleteSelectedTracksFromPlaylist = useEventCallback(() => {
		setTracks(
			currTracks => new Set([...currTracks].filter(t => !selectedPlaylistTracks.has(t))),
		);
		deselectAllPlaylistTracks();
	});

	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener('hardwareBackPress', (): boolean => {
				if (selectedNewTracks.size > 0) {
					deselectAllNewTracks();
					return true;
				}
				if (visibleSelectTrackToAdd) {
					setVisibleSelectTrackToAdd(false);
					return true;
				}
				if (selectedPlaylistTracks.size > 0) {
					deselectAllPlaylistTracks();
					return true;
				}
				return false;
			});
			return () => {
				sub.remove();
			};
		}, [
			visibleSelectTrackToAdd,
			selectedNewTracks.size,
			selectedPlaylistTracks.size,
			deselectAllNewTracks,
			deselectAllPlaylistTracks,
		]),
	);

	const moveTrackUp = useCallback(
		(key: string): void => {
			swapTracks(key, -1);
		},
		[swapTracks],
	);
	const moveTrackDown = useCallback(
		(key: string): void => {
			swapTracks(key, 1);
		},
		[swapTracks],
	);
	useEffect(() => {
		if (shouldSave) {
			setShouldSave(false);
			setPlaylistTracks(name, convertReactKeyToTrackId(tracks));
			if (playlistBeingPlayed === name) replaceQueue([...tracks]);
		}
	}, [tracks, shouldSave, name, playlistBeingPlayed]);
	const [isEditing, setIsEditing] = useState(false);
	const startEditing = useCallback(() => {
		setIsEditing(true);
	}, []);
	const finishEditing = useCallback(() => {
		setIsEditing(false);
		setPlaylistTracks(name, convertReactKeyToTrackId(tracks));
		if (playlistBeingPlayed === name) replaceQueue([...tracks]);
	}, [name, playlistBeingPlayed, tracks]);
	const playInOrder = useCallback(() => {
		playPlaylist(name, { order: 'inOrder' });
	}, [name]);

	const playInRandomOrder = useCallback(() => {
		playPlaylist(name, { order: 'random' });
	}, [name]);
	const changeRepeatMode = useCallback(() => {
		setRepeatMode(currRepeatMode => {
			switch (currRepeatMode) {
				case TrackPlayer.REPEAT_MODE_OFF:
					return TrackPlayer.REPEAT_MODE_ALL;
				case TrackPlayer.REPEAT_MODE_ALL:
					return TrackPlayer.REPEAT_MODE_ONE;
				case TrackPlayer.REPEAT_MODE_ONE:
					return TrackPlayer.REPEAT_MODE_OFF;
				default:
					// same as case none
					return TrackPlayer.REPEAT_MODE_ALL;
			}
		});
	}, []);
	const { trackBeingPlayed, playlistBeingPlayed } = useCurrentPlaying();
	useEffect(() => {
		const run = async (): Promise<void> => {
			if (repeatMode !== undefined) {
				if (playlistBeingPlayed === name) TrackPlayer.setRepeatMode(repeatMode);
				const playlists = await getPlaylistsJSON();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (playlists[name]) playlists[name]!.repeat = repeatMode;
				await setPlaylistsJSON(playlists);
			}
		};
		run();
	}, [repeatMode, name, playlistBeingPlayed]);

	const renderWhenEmpty = useRef(
		<Text style={styles.emptyPlaylistMessage}>This playlist is empty</Text>,
	).current;
	const getStyleForTrackBeingPlayed: React.ComponentPropsWithoutRef<
		typeof LocalTrackList
	>['textStyle'] = key => {
		if (playlistBeingPlayed === name && trackBeingPlayed === key) {
			return [styles.trackText, styles.currentTrackText];
		}
		return styles.trackText;
	};
	return (
		<View style={styles.container}>
			<Text style={styles.playlistNameText}>{name}</Text>
			<View style={styles.playlistButtonsContainer}>
				<IconButton
					name="play-arrow"
					onPress={playInOrder}
					iconStyle={styles.playlistButtonIcon}
				/>
				<IconButton
					name="all-inclusive"
					onPress={playInRandomOrder}
					iconStyle={styles.playlistButtonIcon}
				/>
				<IconButton
					name={isEditing ? 'save' : 'edit'}
					onPress={isEditing ? finishEditing : startEditing}
					iconStyle={styles.playlistButtonIcon}
				/>
				<IconButton
					name={repeatMode === TrackPlayer.REPEAT_MODE_ONE ? 'repeat-one' : 'repeat'}
					onPress={changeRepeatMode}
					iconStyle={[
						styles.playlistButtonIcon,
						repeatMode === TrackPlayer.REPEAT_MODE_OFF || repeatMode === undefined
							? { color: colors.DISABLED_PINK }
							: null,
					]}
				/>
			</View>
			<View style={styles.scrollWrapper}>
				<ScrollView
					style={styles.trackList}
					contentContainerStyle={styles.scrollContentContainer}
					overScrollMode="always">
					<LocalTrackList
						onPress={isEditing ? undefined : play}
						filter={tracks}
						keyForData={idFromReactKey}
						textStyle={getStyleForTrackBeingPlayed}
						textContainerStyle={styles.trackContainer}
						ref={localTracklistRef}
						renderWhenEmpty={renderWhenEmpty}
						selected={isEditing ? selectedPlaylistTracks : undefined}
						onSelect={isEditing ? onSelectChangeForPlaylistTracks : undefined}
						leftIcon={isEditing ? 'keyboard-arrow-up' : undefined}
						leftIconOnPress={isEditing ? moveTrackUp : undefined}
						leftIconStyle={isEditing ? styles.trackIcon : undefined}
						rightIcon={isEditing ? 'keyboard-arrow-down' : undefined}
						rightIconOnPress={isEditing ? moveTrackDown : undefined}
						rightIconStyle={isEditing ? styles.trackIcon : undefined}
						selectedTextContainerStyle={
							isEditing ? styles.selectedPlaylistTrackContainer : undefined
						}
					/>
				</ScrollView>
			</View>
			<IconButton
				onPress={openSelectMenuForNewTracks}
				name="add"
				iconStyle={styles.addNewIcon}
				style={styles.addNewContainer}
				textStyle={styles.addNewText}>
				Add track to playlist
			</IconButton>

			{/** Modals */}
			<AbsoluteBackground
				visible={visibleSelectTrackToAdd}
				close={closeSelectMenuForNewTracks}>
				<View style={styles.trackToAddCenter}>
					<View style={styles.trackToAddContainer}>
						<ScrollView overScrollMode="always">
							<LocalTrackList
								selected={selectedNewTracks}
								onPress={addPressedNewTrack}
								ref={localTracklistRef}
								onSelect={onSelectChangeForNewTracks}
								textContainerStyle={styles.trackToAdd}
								textStyle={styles.trackToAddText}
								selectedTextContainerStyle={styles.selectedTrackToAdd}
							/>
						</ScrollView>
					</View>
				</View>
			</AbsoluteBackground>
			<SelectMenu
				icons={['delete']}
				descriptions={['Delete track from playlist']}
				onClear={deselectAllPlaylistTracks}
				onPress={[deleteSelectedTracksFromPlaylist]}
				visible={selectedPlaylistTracks.size > 0}
			/>
			<SelectMenu
				icons={['add']}
				descriptions={['Add track to playlist']}
				onClear={deselectAllNewTracks}
				onPress={[addSelectedNewTracks]}
				visible={selectedNewTracks.size > 0}
			/>
		</View>
	);
};

export default Playlist;
