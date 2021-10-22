# Expo Mega Demo

Experimenting with new awesome React Native + Expo features.

**Work in progress**. More info soon.

A preview video (**click the image**):
[![Watch the video](https://user-images.githubusercontent.com/278340/135893709-e7549883-8d16-4446-8f1d-ef0e4bae024c.jpg)](https://youtu.be/GIyyjOoqZ5Y)

### Core features:

> **⚠️ Caution!** Many features used in this demo are in early, experimental stage and they're not ready for production. Use on your own risk.

- Runs on [Expo SDK 43](https://blog.expo.dev/expo-sdk-43-aa9b3c7d5541), takes advantage of the new [Expo Modules architecture](https://blog.expo.dev/whats-new-in-expo-modules-infrastructure-7a7cdda81ebc).
- Uses [Expo custom managed workflow](https://docs.expo.dev/workflow/customizing/) - a _prebuilding_ is used to generate native directories. All native changes (even these unusual) and patches are covered with config plugins and yarn `postinstall` script.
- Uses [Expo Dev Client](https://docs.expo.dev/clients/introduction/), react-navigation, ui-kitten
- Bluetooth communication using [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) with [config plugin](https://github.com/expo/config-plugins/tree/master/packages/react-native-ble-plx)
- Color picker using Expo GL, made from [this tutorial from William Candillon](https://www.youtube.com/watch?v=bAZhVl9YvB4), but rewritten to [Reanimated v2](https://github.com/software-mansion/react-native-reanimated)
- Music Picker is an expo-module written using [Swift "Sweet" API](https://blog.expo.dev/a-peek-into-the-upcoming-sweet-expo-module-api-6de6b9aca492).
- JSI real-time Audio streaming, taken from [this PR](https://github.com/expo/expo/pull/13516), thank you Marc!
- Player controls stolen from NCL (internal Expo rn-tester equivalent).
- FFT is calculated in the JS thread. The spectrum bin heights are written to `SharedValue`s and animated with Reanimated 2.
  > There is plan to use [react-native-multithreading](https://github.com/mrousavy/react-native-multithreading) and calculate it in a separate thread. But even without that, the JS keeps around 57-59 fps.
- Hardware: Arduino Uno and the HM-10 BLE 4.0 module. Read more in the [Hardware README](./hardware/README.md).

## How to run

First time:

1. Make sure you have Expo and all the stuff installed and configured (including Xcode)
1. `yarn install`
1. `yarn prebuild`
1. `yarn run:ios`

Just to start the bundler (without rebuilding client): run `yarn start`.

## Known issues

Most of them are caused by limited time of mine, and also by some libraries, which depend on Expo, but have not yet been updated to support recently-released Expo SDK 43.

- iOS JSI Audio is not working on Hermes yet. I'm working on it.
- Frequency bin labels are wrong 🤷. Eventually I needed to display them in log scale and I am too lazy to think about how to recalculate everything properly.
- Modifying the `sound.onAudioSampleReceived` callback and the Reanimated 2 stuff requires at least picking the song again to reload properly, sometimes whole app restart is needed.
- May not work on emulator.
- Not yet works for Android
  - No JSI-related `expo-av` changes applied.
  - The MusicPicker module isn't implemented yet for that platform (there's a copy-pasted `expo-haptics` code ¯\_(ツ)\_/¯)

### Applied patches

See the [`postinstall.js`](./postinstall.js) script and the `plugins` section of [`app.json`](./app.json) to see how the patches are applied

- patch-package for `react-native-ble-plx` and [Podfile config plugin](./patches/fix-bluetooth.plugin.js), because of [this issue](https://github.com/dotintent/react-native-ble-plx/issues/899).
- patch-package for `webgltexture-loader-expo@1.0.0`, a dependency of `gl-react-expo` - it has not yet been updated to use `expo-modules-core` in favor of `@unimodules/core`.
- new `expo-modules-autolinking` requires modules to be specified in `package.json` dependencies. I don't want to copy my custom native modules to `node_modules` they are deleted after being copied there by yarn.
- `expo-cli` built-in plugins sets the `Push Notifications` capability even when `expo-notifications` are not installed and I see no way to disable it. Another plugin was written to delete that entitlement.
- MusicPicker module: iOS requires another `Info.plist` value about `Media Library usage permission` - a config plugin takes care of that
- The [`custom_native_modules`](./custom_native_modules) directory needs to be added to autolinking paths in `Podfile`. A config plugin takes care of that.
