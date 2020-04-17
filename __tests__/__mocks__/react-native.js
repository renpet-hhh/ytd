const rn = require('react-native')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter.js', () => {
    const { EventEmitter } = require('events');
    return EventEmitter;
});
jest.mock('react-native/Libraries/Utilities/Platform.ios.js');

rn.NativeModules.RNGestureHandlerModule = {
    attachGestureHandler: jest.fn(),
    createGestureHandler: jest.fn(),
    dropGestureHandler: jest.fn(),
    updateGestureHandler: jest.fn(),
    forceTouchAvailable: jest.fn(),
    State: {},
    Directions: {}
};

rn.NativeModules.PlatformConstants = {
    forceTouchAvailable: false,
};

rn.NativeModules.UIManager = {
    RCTView: () => ({
        directEventTypes: {},
    }),
};

module.exports = rn;