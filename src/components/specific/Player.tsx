import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import colors from 'src/constants/colors';
import IconButton from 'src/components/generic/IconButton';
import TrackPlayer from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import usePrevious from 'src/hooks/usePrevious';
import { getInternalSettings } from 'src/services/settings';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.BLACK,
		borderColor: colors.GOLD,
		borderWidth: 2,
		borderTopRightRadius: 5,
		borderTopLeftRadius: 5,
		borderRadius: 0,
		borderBottomWidth: 0,
	},
	playerIconContainer: {
		padding: 15,
	},
	playerIcon: {
		fontSize: 28,
		color: colors.WHITE,
	},
	playerSlideController: {
		flex: 1,
		height: 70,
		position: 'relative',
		tintColor: colors.WHITE,
	},
});

const Player = ({}): JSX.Element | null => {
	const [state, setState] = useState(TrackPlayer.STATE_STOPPED);
	// No types for useTrackPlayerProgress yet
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { position, duration } = (TrackPlayer as any).useTrackPlayerProgress();
	const [isSeeking, setIsSeeking] = useState(false);
	const [shouldCheckIfPositionUpdated, setShouldCheckIfPositionUpdated] = useState(false);
	const [seekPosition, setSeekPosition] = useState(0);
	const previousPosition = usePrevious(position);
	useEffect(() => {
		/** If position and seekPosition are more distant than this value, we should keep waiting */
		const acceptableDistance = 3;
		/** when the slider is released, setting isSeeking to false immediately
		 * would cause visual bugs because position would be used as the value for the slider,
		 * but position is not yet updated. Then, we wait for it to be updated. */
		// ps-note: unfourtanely, the flickers are still happening
		if (position < previousPosition) {
			// the seek caused the track to end and a new track is playing from the start,
			// so we wait until position is close to the start
			if (shouldCheckIfPositionUpdated && Math.abs(position - 0) < acceptableDistance) {
				setIsSeeking(false);
			}
			return;
		}
		if (
			shouldCheckIfPositionUpdated &&
			Math.abs(position - seekPosition) < acceptableDistance
		) {
			setShouldCheckIfPositionUpdated(false);
			setIsSeeking(false);
		}
	}, [position, previousPosition, seekPosition, shouldCheckIfPositionUpdated]);
	useEffect(() => {
		/** when isSeeking changes to true,
		 seekPosition will be used as the value for the slider. Then, to avoid flips
		 in the slider, seekPosition must not be far from current position */
		if (!isSeeking) setSeekPosition(position);
	}, [isSeeking, position]);
	useEffect(() => {
		const run = async (): Promise<void> => {
			const initialPlayerState = await TrackPlayer.getState();
			if (
				initialPlayerState === TrackPlayer.STATE_PLAYING ||
				initialPlayerState === TrackPlayer.STATE_PAUSED ||
				initialPlayerState === TrackPlayer.STATE_STOPPED
			) {
				setState(initialPlayerState);
				if (initialPlayerState === TrackPlayer.STATE_STOPPED) {
					setSeekPosition(0);
				}
			}
		};
		run();
		const subs = [
			TrackPlayer.addEventListener('playback-state', ({ state: playerState }) => {
				if (
					playerState === TrackPlayer.STATE_PLAYING ||
					playerState === TrackPlayer.STATE_PAUSED ||
					playerState === TrackPlayer.STATE_STOPPED
				) {
					setState(playerState);
					if (playerState === TrackPlayer.STATE_STOPPED) {
						setSeekPosition(0);
					}
				}
			}),
		];
		return () => {
			subs.forEach(sub => sub.remove());
		};
	}, []);
	const onPlay = useCallback(async (): Promise<void> => {
		if (state === TrackPlayer.STATE_PLAYING) {
			await TrackPlayer.pause();
		} else {
			await TrackPlayer.play();
		}
	}, [state]);
	const onCancel = useCallback(async (): Promise<void> => {
		await TrackPlayer.setupPlayer();
		await TrackPlayer.reset();
	}, []);
	const playIconName = state === TrackPlayer.STATE_PLAYING ? 'pause' : 'play-arrow';
	const containerStyleProp = [styles.container];
	const value: number =
		isSeeking || shouldCheckIfPositionUpdated
			? seekPosition
			: // : seekPosition > 0 && Math.abs(position - seekPosition) > 1
			  // ? seekPosition
			  position;
	if (duration === 0 || state === TrackPlayer.STATE_STOPPED) return null;
	return (
		<View style={containerStyleProp}>
			{/**<Text style={{ padding: 20, fontSize: 60 }}>{state}</Text>*/}
			<IconButton
				name={playIconName}
				iconStyle={styles.playerIcon}
				onPress={onPlay}
				style={styles.playerIconContainer}
			/>
			<Slider
				thumbTintColor={colors.WHITE}
				minimumTrackTintColor={colors.SUN}
				maximumTrackTintColor={colors.GOLD}
				style={styles.playerSlideController}
				minimumValue={0}
				maximumValue={duration}
				value={value}
				step={1}
				onValueChange={v => {
					setSeekPosition(v);
				}}
				onSlidingStart={() => {
					setIsSeeking(true);
				}}
				onSlidingComplete={v => {
					const run = async (): Promise<void> => {
						if (Math.abs(duration - v) < 1) {
							const repeat = (await getInternalSettings()).currentPlaylist?.repeat;
							if (repeat === 'track') {
								v = 0;
							}
						}
						setSeekPosition(v);
						// don't set isSeeking to false yet,
						// let's wait until position is updated
						setShouldCheckIfPositionUpdated(true);
						TrackPlayer.seekTo(v);
					};
					run();
				}}
			/>
			<IconButton
				name="clear"
				iconStyle={styles.playerIcon}
				onPress={onCancel}
				style={styles.playerIconContainer}
			/>
		</View>
	);
};

export default Player;
