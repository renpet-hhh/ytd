import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Dimensions,
	TouchableWithoutFeedback,
	BackHandler,
	Alert,
	ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Routes } from 'src/types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconButton from 'src/components/generic/IconButton';
import colors from 'src/constants/colors';
import { createPlaylist, deletePlaylist } from 'src/services/playlist';
import PlaylistList from 'src/components/specific/PlaylistList';
import { Playlist } from 'src/types/data';
import SelectMenu from 'src/components/generic/SelectMenu';
import useMultiselect from 'src/hooks/useMultiselect';
import { ExtractRef } from 'src/types/utils';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import useEventCallback from 'src/hooks/useEventCallback';
import LabeledTextInputPrompt from 'src/components/generic/LabeledTextInputPrompt';
import { downloadTrack } from 'src/services/download';

type Props = {
	navigation: StackNavigationProp<Routes, 'Playlists'>;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.BACKGROUND_PURPLE,
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	title: {
		fontSize: 48,
		marginTop: 30,
		color: colors.WHITE,
	},
	arrowBackContainer: {
		position: 'absolute',
		top: 25,
		left: 10,
	},
	listHeader: {
		marginVertical: 50,
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignItems: 'center',
		width: Dimensions.get('window').width,
		height: 50,
	},
	labeledIconContainer: {
		paddingRight: 15,
	},
	iconContainer: {
		borderWidth: 2,
		borderRadius: 10,
		borderColor: colors.WHITE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconStyle: {
		fontSize: 32,
		color: colors.WHITE,
		padding: 6,
	},
	iconText: {
		fontSize: 24,
		padding: 6,
		color: colors.WHITE,
	},
	createPlaylistCenter: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	createPlaylistContainer: {
		width: Dimensions.get('window').width * 0.8,
		padding: 15,
		alignItems: 'center',
		backgroundColor: colors.GOLD,
		borderColor: colors.BROWN,
		borderWidth: 5,
		borderRadius: 5,
	},
	createPlaylistInputContainer: {
		marginBottom: 15,
		flexDirection: 'column',
		alignSelf: 'stretch',
	},
	createPlaylistInput: {
		paddingHorizontal: 15,
		backgroundColor: colors.BROWN,
		borderRadius: 50,
		color: colors.SUN,
		fontSize: 24,
		alignSelf: 'stretch',
		marginTop: 10,
	},
	createPlaylistButton: {
		borderColor: colors.BROWN,
	},
	createPlaylistButtonText: {
		color: colors.BROWN,
	},
	playlistContainer: {
		justifyContent: 'flex-start',
		alignSelf: 'stretch',
		marginHorizontal: 25,
	},
	playlistItemText: {
		marginLeft: 10,
		fontSize: 24,
		marginVertical: 8,
	},
	playlistSelectedContainer: {
		backgroundColor: colors.BROWN,
	},
	scrollView: {
		width: 0.9 * Dimensions.get('screen').width,
		minHeight: 0.65 * Dimensions.get('screen').height,
	},
});

const Playlists = ({ navigation }: Props): JSX.Element => {
	const [visibleCreatePlaylist, setVisibleCreatePlaylist] = useState(false);
	const [visibleDownload, setVisibleDownload] = useState(false);
	const playlistListRef: ExtractRef<typeof PlaylistList> = useRef(null);
	const [selectedPlaylists, setSelectedPlaylists, onSelectChange] = useMultiselect<string>();
	// refresh the playlist list so that an updated playlist is sent to the Playlist screen
	const isFocused = useIsFocused();
	useEffect(() => {
		if (isFocused) playlistListRef.current?.refresh();
	}, [isFocused]);

	const showNew = useEventCallback((): void => {
		setVisibleCreatePlaylist(true);
	});
	const showDownload = useEventCallback((): void => {
		setVisibleDownload(true);
	});
	const onPressPlaylist = useCallback(
		(name: string, playlist: Playlist | undefined): void => {
			if (!playlist) {
				Alert.alert(
					'Error',
					"Couldn't find the playlist, try deleting and creating it again",
					[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
					{ cancelable: true },
				);
				return;
			}
			navigation.navigate('Playlist', { playlist, name });
		},
		[navigation],
	);
	const deselectAll = useCallback((): void => {
		setSelectedPlaylists(new Set());
	}, [setSelectedPlaylists]);
	const deleteSelectedPlaylists = useEventCallback(
		async (): Promise<void> => {
			await deletePlaylist(selectedPlaylists);
			deselectAll();
			playlistListRef.current?.refresh();
		},
	);

	const onPressCreatePlaylist = useCallback(async (name: string): Promise<void> => {
		await createPlaylist(name).catch(err => {
			console.log("Couldn't create playlist: " + err.message);
		});
		playlistListRef.current?.refresh();
	}, []);
	const onPressDownload = useCallback(async (url: string): Promise<void> => {
		const { promise } = await downloadTrack(url);
		await promise.catch(() => null);
	}, []);
	const closeCreatePlayList = useCallback((): void => {
		setVisibleCreatePlaylist(false);
	}, []);
	/** Download Modal */
	const closeDownload = useCallback((): void => {
		setVisibleDownload(false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener('hardwareBackPress', (): boolean => {
				if (visibleCreatePlaylist) {
					closeCreatePlayList();
					return true;
				}
				if (visibleDownload) {
					closeDownload();
					return true;
				}
				if (selectedPlaylists.size > 0) {
					deselectAll();
					return true;
				}
				return false;
			});
			return () => {
				sub.remove();
			};
		}, [
			visibleCreatePlaylist,
			visibleDownload,
			selectedPlaylists.size,
			closeCreatePlayList,
			closeDownload,
			deselectAll,
		]),
	);
	const goBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.replace('Home');
		}
	}, [navigation]);

	return (
		<TouchableWithoutFeedback onPress={deselectAll}>
			<View style={styles.container}>
				<TouchableOpacity onPress={goBack} style={styles.arrowBackContainer}>
					<Icon name="arrow-back" style={styles.iconStyle} />
				</TouchableOpacity>
				<Text style={styles.title}>Playlists</Text>
				<View style={styles.listHeader}>
					<IconButton
						onPress={showNew}
						name="add"
						style={[styles.iconContainer, styles.labeledIconContainer]}
						iconStyle={styles.iconStyle}
						textStyle={styles.iconText}>
						New
					</IconButton>
					<IconButton
						onPress={showDownload}
						name="get-app"
						style={[styles.iconContainer, styles.labeledIconContainer]}
						iconStyle={styles.iconStyle}
						textStyle={styles.iconText}>
						Download
					</IconButton>
				</View>
				<ScrollView style={styles.scrollView} overScrollMode="always">
					<PlaylistList
						onPress={onPressPlaylist}
						selected={selectedPlaylists}
						onSelect={onSelectChange}
						textStyle={styles.playlistItemText}
						ref={playlistListRef}
						selectedTextContainerStyle={styles.playlistSelectedContainer}
					/>
				</ScrollView>
				{/** Modals */}
				<LabeledTextInputPrompt
					close={closeDownload}
					visible={visibleDownload}
					label="URL"
					placeholder="https://youtube.com/watch?v=..."
					buttonText="Download"
					onPress={onPressDownload}
				/>
				<LabeledTextInputPrompt
					visible={visibleCreatePlaylist}
					close={closeCreatePlayList}
					label="Playlist name"
					buttonText="Create"
					onPress={onPressCreatePlaylist}
				/>
				<SelectMenu
					icons={['delete']}
					descriptions={['Delete playlist']}
					onPress={[deleteSelectedPlaylists]}
					onClear={deselectAll}
					visible={selectedPlaylists.size > 0}
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default Playlists;
