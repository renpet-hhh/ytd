/**
 * @format
 */
import { AppRegistry } from 'react-native';
import React from 'react';

const whyDidYouRender = require('@welldone-software/why-did-you-render');
whyDidYouRender(React, {
    trackAllPureComponents: true,
});

import App from './src/App';
import { name as appName } from './app.json';
import TrackPlayer from 'react-native-track-player';

import playbackService from './src/services/playbackservice';


AppRegistry.registerComponent(appName, () => App);

TrackPlayer.registerPlaybackService(() => playbackService);
